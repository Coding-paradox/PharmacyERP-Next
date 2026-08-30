import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@pharmacy/database';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStockSummary(pharmacyId: string) {
    const medicines = await this.prisma.medicine.findMany({
      where: {
        pharmacyId,
        deletedAt: null,
      },
      select: {
        id: true,
        code: true,
        name: true,
        stock: true,
        minStock: true,
        isActive: true,
        category: {
          select: { name: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const lowStock = medicines.filter((m) => m.stock <= m.minStock && m.isActive);
    const outOfStock = medicines.filter((m) => m.stock === 0 && m.isActive);

    return {
      total: medicines.length,
      lowStock: lowStock.length,
      outOfStock: outOfStock.length,
      medicines,
    };
  }

  async getMovements(
    pharmacyId: string,
    medicineId?: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    const where: Prisma.InventoryMovementWhereInput = {
      pharmacyId,
    };

    if (medicineId) {
      where.medicineId = medicineId;
    }

    const [movements, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          medicine: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    return {
      data: movements,
      total,
      limit,
      offset,
    };
  }

  async adjustStock(adjustStockDto: AdjustStockDto, userId: string, pharmacyId: string) {
    const { medicineId, quantity, movementType, notes } = adjustStockDto;

    const medicine = await this.prisma.medicine.findFirst({
      where: {
        id: medicineId,
        pharmacyId,
        deletedAt: null,
      },
    });

    if (!medicine) {
      throw new NotFoundException('Médicament non trouvé.');
    }

    const newStock = movementType === 'ADJUSTMENT'
      ? quantity
      : movementType === 'DAMAGED' || movementType === 'EXPIRED'
        ? Math.max(0, medicine.stock - quantity)
        : medicine.stock + quantity;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const updatedMedicine = await tx.medicine.update({
          where: { id: medicineId },
          data: { stock: newStock },
        });

        const movement = await tx.inventoryMovement.create({
          data: {
            medicineId,
            pharmacyId,
            userId,
            quantity: movementType === 'ADJUSTMENT' ? quantity : quantity,
            previousStock: medicine.stock,
            newStock,
            movementType,
            notes: notes || null,
          },
        });

        this.logger.log(`Stock adjusted for ${medicine.name}: ${medicine.stock} -> ${newStock}`);
        return { medicine: updatedMedicine, movement };
      });
    } catch (error: any) {
      this.logger.error(`Failed to adjust stock: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de l\'ajustement du stock');
    }
  }

  async getLowStockAlerts(pharmacyId: string) {
    return this.prisma.medicine.findMany({
      where: {
        pharmacyId,
        deletedAt: null,
        isActive: true,
        stock: {
          lte: this.prisma.medicine.fields.minStock,
        },
      },
      select: {
        id: true,
        code: true,
        name: true,
        stock: true,
        minStock: true,
        category: {
          select: { name: true },
        },
      },
      orderBy: { stock: 'asc' },
    });
  }
}
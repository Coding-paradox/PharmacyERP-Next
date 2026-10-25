import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  ConflictException,
  BadRequestException,
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

    try {
      return await this.prisma.$transaction(async (tx) => {
        const medicine = await tx.medicine.findFirst({
          where: { id: medicineId, pharmacyId, deletedAt: null },
        });
        if (!medicine) {
          throw new NotFoundException('Médicament non trouvé dans cette pharmacie.');
        }

        if ((movementType === 'DAMAGED' || movementType === 'EXPIRED') && quantity > medicine.stock) {
          throw new BadRequestException('La quantité à retirer dépasse le stock disponible.');
        }

        const newStock = movementType === 'ADJUSTMENT'
          ? quantity
          : movementType === 'DAMAGED' || movementType === 'EXPIRED'
            ? medicine.stock - quantity
            : medicine.stock + quantity;

        // Compare-and-set : évite d'écraser une modification concurrente du stock.
        const changed = await tx.medicine.updateMany({
          where: { id: medicineId, pharmacyId, deletedAt: null, stock: medicine.stock },
          data: { stock: newStock },
        });
        if (changed.count !== 1) {
          throw new ConflictException('Le stock a changé simultanément. Rechargez la page puis réessayez.');
        }

        const updatedMedicine = await tx.medicine.findFirstOrThrow({
          where: { id: medicineId, pharmacyId },
        });
        const movement = await tx.inventoryMovement.create({
          data: {
            medicineId,
            pharmacyId,
            userId,
            quantity: newStock - medicine.stock,
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
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException("Erreur lors de l'ajustement du stock");
    }
  }

  async getLowStockAlerts(pharmacyId: string) {
    const medicines = await this.prisma.medicine.findMany({
      where: { pharmacyId, deletedAt: null, isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        stock: true,
        minStock: true,
        category: { select: { name: true } },
      },
      orderBy: { stock: 'asc' },
    });

    return medicines.filter((medicine) => medicine.stock <= medicine.minStock);
  }
}

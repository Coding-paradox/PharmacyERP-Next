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
import { CompleteStocktakeDto } from './dto/complete-stocktake.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService, private readonly notifications: NotificationsService) {}

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
    const { medicineId, quantity, movementType, notes, medicineBatchId, batchNumber, expiryDate } = adjustStockDto;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const medicine = await tx.medicine.findFirst({
          where: { id: medicineId, pharmacyId, deletedAt: null },
        });
        if (!medicine) {
          throw new NotFoundException('Médicament non trouvé dans cette pharmacie.');
        }

        if (!['ADJUSTMENT', 'DAMAGED', 'EXPIRED'].includes(movementType)) {
          throw new BadRequestException('Ce formulaire sert uniquement aux ajustements, produits endommagés ou périmés.');
        }

        const delta = movementType === 'ADJUSTMENT' ? quantity - medicine.stock : -quantity;
        let targetBatchId = medicineBatchId;
        if (delta < 0 || movementType === 'DAMAGED' || movementType === 'EXPIRED') {
          if (!medicineBatchId) throw new BadRequestException('Sélectionnez le lot concerné par le retrait.');
          const batch = await tx.medicineBatch.findFirst({ where: { id: medicineBatchId, medicineId, pharmacyId } });
          if (!batch || batch.quantity < -delta) throw new BadRequestException('La quantité à retirer dépasse le stock de ce lot.');
          const startOfToday = new Date();
          startOfToday.setUTCHours(0, 0, 0, 0);
          if (movementType === 'EXPIRED' && (!batch.expiryDate || batch.expiryDate >= startOfToday)) {
            throw new BadRequestException('Le lot sélectionné n’est pas encore périmé.');
          }
          const changedBatch = await tx.medicineBatch.updateMany({
            where: { id: batch.id, quantity: { gte: -delta } },
            data: { quantity: { decrement: -delta } },
          });
          if (changedBatch.count !== 1) throw new ConflictException('Le stock du lot a changé simultanément.');
        } else if (delta > 0) {
          if (!batchNumber?.trim()) throw new BadRequestException('Indiquez le numéro du lot ajouté.');
          const expiry = expiryDate ? new Date(expiryDate) : null;
          if (expiry && Number.isNaN(expiry.getTime())) throw new BadRequestException('Date de péremption invalide.');
          const startOfToday = new Date();
          startOfToday.setUTCHours(0, 0, 0, 0);
          if (expiry && expiry < startOfToday) throw new BadRequestException('Impossible d’ajouter un lot déjà périmé.');
          const batch = await tx.medicineBatch.upsert({
            where: { pharmacyId_medicineId_batchNumber: { pharmacyId, medicineId, batchNumber: batchNumber.trim() } },
            create: { pharmacyId, medicineId, batchNumber: batchNumber.trim(), expiryDate: expiry, quantity: delta, costPrice: medicine.costPrice, currency: medicine.costCurrency },
            update: { quantity: { increment: delta } },
          });
          if (batch.expiryDate?.toISOString().slice(0, 10) !== expiry?.toISOString().slice(0, 10)) {
            throw new BadRequestException('Ce numéro de lot est déjà associé à une autre date de péremption.');
          }
          targetBatchId = batch.id;
        }
        const newStock = medicine.stock + delta;

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
            medicineBatchId: targetBatchId,
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

  async getExpiryAlerts(pharmacyId: string, days = 90) {
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    const throughDate = new Date(startOfToday);
    throughDate.setUTCDate(throughDate.getUTCDate() + Math.max(1, Math.min(days, 365)));
    const batches = await this.prisma.medicineBatch.findMany({
      where: { pharmacyId, quantity: { gt: 0 }, expiryDate: { lte: throughDate } },
      include: { medicine: { select: { id: true, name: true, code: true } } },
      orderBy: [{ expiryDate: { sort: 'asc', nulls: 'last' } }, { medicine: { name: 'asc' } }],
    });
    return batches.map((batch) => ({ ...batch, expired: !!batch.expiryDate && batch.expiryDate < startOfToday }));
  }

  async createStocktake(userId: string, pharmacyId: string) {
    const medicines = await this.prisma.medicine.findMany({
      where: { pharmacyId, deletedAt: null, isActive: true },
      include: { batches: { orderBy: [{ expiryDate: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }] } },
      orderBy: { name: 'asc' },
    });
    const items: Prisma.StocktakeItemCreateManyStocktakeInput[] = [];
    for (const medicine of medicines) {
      if (medicine.batches.length) {
        for (const batch of medicine.batches) {
          items.push({ medicineId: medicine.id, medicineBatchId: batch.id, batchNumber: batch.batchNumber, expiryDate: batch.expiryDate, expectedQuantity: batch.quantity });
        }
      } else {
        items.push({ medicineId: medicine.id, medicineBatchId: null, batchNumber: '__NO_BATCH__', expiryDate: null, expectedQuantity: 0 });
      }
    }
    return this.prisma.stocktake.create({
      data: { pharmacyId, userId, items: { createMany: { data: items } } },
      include: { items: { include: { medicine: { select: { id: true, name: true, code: true } } }, orderBy: [{ medicine: { name: 'asc' } }, { batchNumber: 'asc' }] } },
    });
  }

  async listStocktakes(pharmacyId: string) {
    return this.prisma.stocktake.findMany({
      where: { pharmacyId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: { select: { firstName: true, lastName: true } }, _count: { select: { items: true } } },
    });
  }

  async getStocktake(id: string, pharmacyId: string) {
    const stocktake = await this.prisma.stocktake.findFirst({
      where: { id, pharmacyId },
      include: { items: { include: { medicine: { select: { id: true, name: true, code: true } } }, orderBy: [{ medicine: { name: 'asc' } }, { batchNumber: 'asc' }] } },
    });
    if (!stocktake) throw new NotFoundException('Session d’inventaire introuvable.');
    return stocktake;
  }

  async completeStocktake(id: string, pharmacyId: string, userId: string, dto: CompleteStocktakeDto) {
    try {
      const completedStocktake = await this.prisma.$transaction(async (tx) => {
        const stocktake = await tx.stocktake.findFirst({ where: { id, pharmacyId }, include: { items: true } });
        if (!stocktake) throw new NotFoundException('Session d’inventaire introuvable.');
        if (stocktake.status !== 'OPEN') throw new BadRequestException('Cette session d’inventaire n’est plus ouverte.');
        const counts = new Map(dto.items.map((item) => [item.itemId, item]));
        if (counts.size !== stocktake.items.length || stocktake.items.some((item) => !counts.has(item.id))) {
          throw new BadRequestException('Le comptage doit contenir exactement toutes les lignes de la session.');
        }

        const itemsByMedicine = new Map<string, typeof stocktake.items>();
        for (const item of stocktake.items) {
          const rows = itemsByMedicine.get(item.medicineId) ?? [];
          rows.push(item);
          itemsByMedicine.set(item.medicineId, rows);
        }

        const startOfToday = new Date();
        startOfToday.setUTCHours(0, 0, 0, 0);
        for (const [medicineId, rows] of itemsByMedicine) {
          const medicine = await tx.medicine.findFirst({ where: { id: medicineId, pharmacyId, deletedAt: null } });
          if (!medicine) throw new ConflictException('Un médicament de cette session a été supprimé ou déplacé.');
          const currentBatches = await tx.medicineBatch.findMany({ where: { medicineId, pharmacyId }, select: { id: true, quantity: true } });
          const snapshotIds = rows.map((row) => row.medicineBatchId).filter((batchId): batchId is string => !!batchId).sort();
          const currentIds = currentBatches.map((batch) => batch.id).sort();
          if (snapshotIds.join('|') !== currentIds.join('|')) throw new ConflictException(`${medicine.name}: les lots ont changé depuis l’ouverture de l’inventaire. Recommencez le comptage.`);
          const expectedTotal = rows.reduce((sum, row) => sum + row.expectedQuantity, 0);
          if (medicine.stock !== expectedTotal) throw new ConflictException(`${medicine.name}: le stock a changé depuis l’ouverture de l’inventaire.`);

          let runningStock = medicine.stock;
          for (const row of rows) {
            const count = counts.get(row.id)!;
            const newQuantity = count.countedQuantity;
            if (row.medicineBatchId) {
              const changed = await tx.medicineBatch.updateMany({
                where: { id: row.medicineBatchId, medicineId, pharmacyId, quantity: row.expectedQuantity },
                data: { quantity: newQuantity },
              });
              if (changed.count !== 1) throw new ConflictException(`${medicine.name}: le lot ${row.batchNumber} a changé pendant le comptage.`);
            } else if (newQuantity > 0) {
              const batchNumber = count.batchNumber?.trim();
              if (!batchNumber || !count.expiryDate || count.expiryDate < startOfToday) {
                throw new BadRequestException(`${medicine.name}: indiquez le numéro de lot et une date de péremption valide pour le nouveau lot.`);
              }
              const batch = await tx.medicineBatch.create({
                data: { pharmacyId, medicineId, batchNumber, expiryDate: count.expiryDate, quantity: newQuantity, costPrice: medicine.costPrice, currency: medicine.costCurrency },
              });
              await tx.stocktakeItem.update({ where: { id: row.id }, data: { medicineBatchId: batch.id, batchNumber, expiryDate: count.expiryDate } });
              row.medicineBatchId = batch.id;
              row.batchNumber = batchNumber;
            }
            const delta = newQuantity - row.expectedQuantity;
            if (delta !== 0) {
              await tx.inventoryMovement.create({
                data: {
                  medicineId, pharmacyId, userId, medicineBatchId: row.medicineBatchId,
                  quantity: delta, previousStock: runningStock, newStock: runningStock + delta,
                  movementType: 'ADJUSTMENT', referenceId: stocktake.id, referenceType: 'stocktake',
                  notes: `Inventaire physique — lot ${row.batchNumber}`,
                },
              });
              runningStock += delta;
            }
            await tx.stocktakeItem.update({ where: { id: row.id }, data: { countedQuantity: newQuantity } });
          }
          const countedTotal = rows.reduce((sum, row) => sum + counts.get(row.id)!.countedQuantity, 0);
          const changedMedicine = await tx.medicine.updateMany({
            where: { id: medicineId, pharmacyId, stock: medicine.stock },
            data: { stock: countedTotal },
          });
          if (changedMedicine.count !== 1) throw new ConflictException(`${medicine.name}: le stock a changé pendant la validation.`);
        }

        const completed = await tx.stocktake.updateMany({ where: { id, pharmacyId, status: 'OPEN' }, data: { status: 'COMPLETED', completedAt: new Date() } });
        if (completed.count !== 1) throw new ConflictException('Cette session a déjà été clôturée.');
        return tx.stocktake.findFirstOrThrow({ where: { id, pharmacyId }, include: { items: { include: { medicine: { select: { name: true, code: true } } } } } });
      });
      await this.notifications.notifyStocktakeCompleted(pharmacyId, completedStocktake);
      await this.notifications.notifyLowStockForMedicines(pharmacyId, completedStocktake.items.map((item) => item.medicineId));
      return completedStocktake;
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof ConflictException) throw error;
      this.logger.error(`Failed to complete stocktake: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la validation de l’inventaire.');
    }
  }

  async cancelStocktake(id: string, pharmacyId: string) {
    const result = await this.prisma.stocktake.updateMany({
      where: { id, pharmacyId, status: 'OPEN' },
      data: { status: 'CANCELLED' },
    });
    if (result.count !== 1) throw new ConflictException('Cette session est introuvable ou déjà clôturée.');
    return { success: true };
  }
}

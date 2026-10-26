import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@pharmacy/database';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { Currency, Prisma, OrderStatus } from '@prisma/client';

@Injectable()
export class PurchasesService {
  private readonly logger = new Logger(PurchasesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createPurchaseDto: CreatePurchaseDto, userId: string, pharmacyId: string) {
    const {
      supplierId,
      supplierName,
      supplierPhone,
      tax,
      currency = Currency.CDF,
      notes,
      items,
    } = createPurchaseDto;

    if (!items || items.length === 0) {
      throw new BadRequestException('La commande doit contenir au moins un article.');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        let totalAmount = 0;
        const purchaseItems = [];

        for (const item of items) {
          const medicine = await tx.medicine.findFirst({
            where: { id: item.medicineId, pharmacyId, deletedAt: null },
            select: { id: true, name: true, costCurrency: true },
          });

          if (!medicine) {
            throw new NotFoundException(`Médicament ${item.medicineId} non trouvé.`);
          }

          const itemCurrency = item.currency ?? medicine.costCurrency;
          if (itemCurrency !== currency) {
            throw new BadRequestException(
              `La devise de ${medicine.name} (${itemCurrency}) ne correspond pas à la devise de l'achat (${currency}).`,
            );
          }

          const total = item.quantity * item.unitPrice;
          totalAmount += total;
          purchaseItems.push({
            medicineId: item.medicineId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: total,
            currency,
            expiryDate: item.expiryDate || null,
            batchNumber: item.batchNumber || null,
          });
        }

        if (supplierId) {
          const supplier = await tx.supplier.findFirst({ where: { id: supplierId, pharmacyId }, select: { id: true } });
          if (!supplier) throw new NotFoundException('Fournisseur non trouvé dans cette pharmacie.');
        }

        const netAmount = totalAmount;
        const taxAmount = tax || 0;
        const totalWithTax = netAmount + taxAmount;

        const purchase = await tx.purchase.create({
          data: {
            invoiceNumber: `PO-${Date.now()}`,
            supplierId: supplierId || null,
            supplierName,
            supplierPhone: supplierPhone || null,
            totalAmount: totalWithTax,
            tax: taxAmount,
            netAmount,
            currency,
            status: OrderStatus.PENDING,
            notes: notes || null,
            pharmacyId,
            userId,
            purchaseItems: {
              create: purchaseItems,
            },
          },
          include: {
            purchaseItems: {
              include: {
                medicine: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    costCurrency: true,
                  },
                },
              },
            },
            supplier: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        this.logger.log(`Purchase created: ${purchase.invoiceNumber}`);
        return purchase;
      });
    } catch (error: any) {
      this.logger.error(`Failed to create purchase: ${error.message}`);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erreur lors de la création de la commande');
    }
  }

  async findAll(pharmacyId: string, status?: string, search?: string) {
    const where: Prisma.PurchaseWhereInput = {
      pharmacyId,
    };

    if (status) {
      where.status = status as OrderStatus;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { supplierName: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.purchase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        purchaseItems: {
          include: {
            medicine: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        _count: {
          select: { purchaseItems: true },
        },
      },
    });
  }

  async findOne(id: string, pharmacyId: string) {
    const purchase = await this.prisma.purchase.findFirst({
      where: {
        id,
        pharmacyId,
      },
      include: {
        supplier: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        purchaseItems: {
          include: {
            medicine: {
              select: {
                id: true,
                name: true,
                code: true,
                costPrice: true,
                sellingPrice: true,
                costCurrency: true,
              },
            },
          },
        },
      },
    });

    if (!purchase) {
      throw new NotFoundException(`Commande d'achat avec l'ID "${id}" non trouvée.`);
    }

    return purchase;
  }

  async update(id: string, pharmacyId: string, updatePurchaseDto: UpdatePurchaseDto) {
    await this.findOne(id, pharmacyId);

    try {
      return await this.prisma.purchase.update({
        where: { id },
        data: {
          status: updatePurchaseDto.status,
          notes: updatePurchaseDto.notes,
        },
        include: {
          supplier: true,
          purchaseItems: {
            include: {
              medicine: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to update purchase: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la mise à jour de la commande');
    }
  }

  async remove(id: string, pharmacyId: string) {
    const purchase = await this.findOne(id, pharmacyId);

    if (purchase.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Seules les commandes en attente peuvent être supprimées.');
    }

    try {
      await this.prisma.$transaction([
        this.prisma.purchaseItem.deleteMany({
          where: { purchaseId: id },
        }),
        this.prisma.purchase.delete({
          where: { id },
        }),
      ]);
      return { success: true, message: 'Commande supprimée avec succès' };
    } catch (error: any) {
      this.logger.error(`Failed to delete purchase: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la suppression de la commande');
    }
  }

  async receive(id: string, pharmacyId: string) {
    const purchase = await this.findOne(id, pharmacyId);

    if (purchase.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Seules les commandes en attente peuvent être réceptionnées.');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Transition atomique : une seule requête concurrente peut réceptionner la commande.
        const transition = await tx.purchase.updateMany({
          where: { id, pharmacyId, status: OrderStatus.PENDING },
          data: { status: OrderStatus.PAID },
        });
        if (transition.count !== 1) {
          throw new ConflictException('Cette commande a déjà été réceptionnée ou modifiée.');
        }
        const updatedPurchase = await tx.purchase.findFirstOrThrow({ where: { id, pharmacyId } });

        // Mettre à jour les stocks
        for (const item of purchase.purchaseItems) {
          // On lit le stock RÉEL du médicament avant de le modifier, pour
          // que l'historique de mouvement (inventory_movements) reflète la
          // vérité — indispensable pour que le propriétaire puisse suivre
          // fidèlement l'évolution du stock depuis son téléphone. Avant ce
          // correctif, previousStock était toujours codé en dur à 0 et
          // newStock reprenait juste la quantité reçue, ce qui rendait tout
          // l'historique d'audit faux dès la 2e livraison d'un médicament.
          const medicineBeforeUpdate = await tx.medicine.findFirstOrThrow({
            where: { id: item.medicineId, pharmacyId, deletedAt: null },
            select: { stock: true },
          });

          const previousStock = medicineBeforeUpdate.stock;
          const newStock = previousStock + item.quantity;

          await tx.medicine.update({
            where: { id: item.medicineId },
            data: {
              stock: {
                increment: item.quantity,
              },
              costPrice: item.unitPrice,
              costCurrency: item.currency,
            },
          });

          // Créer un mouvement de stock
          await tx.inventoryMovement.create({
            data: {
              medicineId: item.medicineId,
              pharmacyId,
              userId: purchase.userId,
              quantity: item.quantity,
              previousStock,
              newStock,
              movementType: 'PURCHASE',
              referenceId: purchase.id,
              referenceType: 'purchase',
              notes: `Réception de la commande ${purchase.invoiceNumber}`,
            },
          });
        }

        return updatedPurchase;
      });
    } catch (error: any) {
      this.logger.error(`Failed to receive purchase: ${error.message}`);
      if (error instanceof ConflictException || error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Erreur lors de la réception de la commande');
    }
  }
}
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@pharmacy/database';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { Currency, Prisma, OrderStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  // Plafond de remise autorisé par ligne de vente, en pourcentage du
  // sous-total de la ligne. Empêche un caissier de saisir un prix
  // arbitraire tout en gardant une marge de négociation légitime et
  // TRAÇABLE (le champ `discount` reste visible dans les rapports, à la
  // différence d'un prix librement modifié qui masquerait l'écart).
  //
  // TODO : rendre ce plafond configurable par pharmacie (table Pharmacy)
  // plutôt qu'une constante en dur, une fois ce comportement validé.
  private readonly MAX_ITEM_DISCOUNT_RATIO = 0.15;

  constructor(private readonly prisma: PrismaService) {}

  async create(createSaleDto: CreateSaleDto, userId: string, pharmacyId: string) {
    const {
      customerName,
      customerPhone,
      paymentMethod,
      discount = 0,
      tax = 0,
      currency = Currency.CDF,
      notes,
      items,
    } = createSaleDto;

    if (!items || items.length === 0) {
      throw new BadRequestException('La vente doit contenir au moins un article.');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        let totalAmount = 0;
        const saleItems = [];

        // On mémorise le mouvement de stock exact de chaque ligne pour créer
        // l'historique d'audit une fois la vente elle-même créée.
        const stockMovements: {
          medicineId: string;
          quantity: number;
          previousStock: number;
          newStock: number;
        }[] = [];

        for (const item of items) {
          const medicine = await tx.medicine.findFirst({
            where: { id: item.medicineId, pharmacyId, deletedAt: null },
          });

          if (!medicine) {
            throw new NotFoundException(`Médicament ${item.medicineId} non trouvé.`);
          }

          const itemCurrency = item.currency ?? medicine.sellingCurrency;
          if (itemCurrency !== currency) {
            throw new BadRequestException(
              `La devise de ${medicine.name} (${itemCurrency}) ne correspond pas à la devise de la vente (${currency}).`,
            );
          }

          // Décrémentation ATOMIQUE et conditionnelle du stock.
          //
          // La clause `stock: { gte: item.quantity }` dans le WHERE et le
          // `decrement` dans le SET s'exécutent en une seule instruction SQL
          // gérée par PostgreSQL — impossible que deux ventes concurrentes du
          // même médicament fassent passer le stock sous zéro, contrairement
          // à l'ancienne version qui lisait le stock puis réécrivait une
          // valeur absolue en deux temps séparés (vulnérable à une "perte de
          // mise à jour" : deux caissiers vendant le même médicament en même
          // temps pouvaient tous les deux réussir alors qu'un seul aurait dû).
          const decrementResult = await tx.medicine.updateMany({
            where: { id: item.medicineId, pharmacyId, deletedAt: null, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });

          if (decrementResult.count === 0) {
            throw new ConflictException(
              `Stock insuffisant pour ${medicine.name}. Disponible: ${medicine.stock}, Demandé: ${item.quantity}`,
            );
          }

          // On relit le stock réel après décrémentation (dans la même
          // transaction) pour que l'historique de mouvement soit exact,
          // même en cas de forte concurrence.
          const updatedMedicine = await tx.medicine.findUniqueOrThrow({
            where: { id: item.medicineId, pharmacyId },
            select: { stock: true },
          });

          stockMovements.push({
            medicineId: item.medicineId,
            quantity: item.quantity,
            previousStock: updatedMedicine.stock + item.quantity,
            newStock: updatedMedicine.stock,
          });

          const itemDiscount = item.discount || 0;

          // Le prix de vente vient TOUJOURS du médicament enregistré en
          // base, jamais de ce que le client envoie — sinon rien
          // n'empêche un prix falsifié (erreur ou fraude) de fausser tout
          // le suivi de bénéfice en temps réel du propriétaire.
          const unitPrice = Number(medicine.sellingPrice);
          const lineSubtotal = item.quantity * unitPrice;

          const maxAllowedDiscount = lineSubtotal * this.MAX_ITEM_DISCOUNT_RATIO;
          if (itemDiscount > maxAllowedDiscount) {
            throw new BadRequestException(
              `La remise sur ${medicine.name} (${itemDiscount}) dépasse le plafond autorisé de ${this.MAX_ITEM_DISCOUNT_RATIO * 100}% (max ${maxAllowedDiscount.toFixed(2)}).`,
            );
          }

          const total = lineSubtotal - itemDiscount;
          totalAmount += total;

          saleItems.push({
            medicineId: item.medicineId,
            quantity: item.quantity,
            unitPrice,
            totalPrice: total,
            currency,
            discount: itemDiscount,
          });
        }

        const netAmount = totalAmount;
        const discountAmount = discount || 0;
        const taxAmount = tax || 0;
        if (discountAmount > netAmount) {
          throw new BadRequestException('La remise globale ne peut pas dépasser le montant net de la vente.');
        }
        const finalTotal = netAmount - discountAmount + taxAmount;

        // Créer la vente (le stock a déjà été réservé atomiquement ci-dessus ;
        // si la création échoue ici, toute la transaction est annulée et le
        // stock est automatiquement restauré par PostgreSQL).
        const sale = await tx.sale.create({
          data: {
            invoiceNumber: `INV-${Date.now()}`,
            customerName: customerName || null,
            customerPhone: customerPhone || null,
            totalAmount: finalTotal,
            discount: discountAmount,
            tax: taxAmount,
            netAmount,
            currency,
            paymentMethod: paymentMethod || PaymentMethod.CASH,
            status: OrderStatus.PAID,
            notes: notes || null,
            pharmacyId,
            userId,
            saleItems: {
              create: saleItems,
            },
          },
          include: {
            saleItems: {
              include: {
                medicine: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    sellingCurrency: true,
                  },
                },
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
        });

        // Journaliser les mouvements de stock, maintenant que la vente existe
        // (nécessaire pour le referenceId).
        for (const movement of stockMovements) {
          await tx.inventoryMovement.create({
            data: {
              medicineId: movement.medicineId,
              pharmacyId,
              userId,
              quantity: -movement.quantity,
              previousStock: movement.previousStock,
              newStock: movement.newStock,
              movementType: 'SALE',
              referenceId: sale.id,
              referenceType: 'sale',
              notes: `Vente ${sale.invoiceNumber}`,
            },
          });
        }

        this.logger.log(`Sale created: ${sale.invoiceNumber}`);
        return sale;
      });
    } catch (error: any) {
      this.logger.error(`Failed to create sale: ${error.message}`);
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Erreur lors de la création de la vente');
    }
  }

  async findAll(pharmacyId: string, status?: string, search?: string) {
    const where: Prisma.SaleWhereInput = {
      pharmacyId,
    };

    if (status) {
      where.status = status as OrderStatus;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        saleItems: {
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
          select: { saleItems: true },
        },
      },
    });
  }

  async findOne(id: string, pharmacyId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: {
        id,
        pharmacyId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        saleItems: {
          include: {
            medicine: {
              select: {
                id: true,
                name: true,
                code: true,
                costPrice: true,
                sellingPrice: true,
                sellingCurrency: true,
              },
            },
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Vente avec l'ID "${id}" non trouvée.`);
    }

    return sale;
  }

  async update(id: string, pharmacyId: string, updateSaleDto: UpdateSaleDto) {
    await this.findOne(id, pharmacyId);

    try {
      return await this.prisma.sale.update({
        where: { id },
        data: {
          status: updateSaleDto.status,
          notes: updateSaleDto.notes,
        },
        include: {
          saleItems: {
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
      this.logger.error(`Failed to update sale: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la mise à jour de la vente');
    }
  }

  async remove(id: string, pharmacyId: string) {
    const sale = await this.findOne(id, pharmacyId);

    if (sale.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Seules les ventes en attente peuvent être supprimées.');
    }

    try {
      await this.prisma.$transaction([
        this.prisma.saleItem.deleteMany({
          where: { saleId: id },
        }),
        this.prisma.sale.delete({
          where: { id },
        }),
      ]);
      return { success: true, message: 'Vente supprimée avec succès' };
    } catch (error: any) {
      this.logger.error(`Failed to delete sale: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la suppression de la vente');
    }
  }

  async cancel(id: string, pharmacyId: string) {
    const sale = await this.findOne(id, pharmacyId);

    if (sale.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cette vente est déjà annulée.');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const updatedSale = await tx.sale.update({
          where: { id },
          data: { status: OrderStatus.CANCELLED },
        });

        // Restaurer les stocks. L'incrément est intrinsèquement sûr en
        // concurrence (contrairement à la décrémentation, additionner ne
        // peut jamais faire passer le stock sous zéro), on utilise quand
        // même l'opérateur atomique `increment` plutôt qu'une réécriture de
        // valeur absolue, par cohérence et pour garder un historique exact.
        for (const item of sale.saleItems) {
          await tx.medicine.update({
            where: { id: item.medicineId },
            data: { stock: { increment: item.quantity } },
          });

          const updatedMedicine = await tx.medicine.findUniqueOrThrow({
            where: { id: item.medicineId },
            select: { stock: true },
          });

          await tx.inventoryMovement.create({
            data: {
              medicineId: item.medicineId,
              pharmacyId,
              userId: sale.userId,
              quantity: item.quantity,
              previousStock: updatedMedicine.stock - item.quantity,
              newStock: updatedMedicine.stock,
              movementType: 'RETURN',
              referenceId: sale.id,
              referenceType: 'sale_cancel',
              notes: `Annulation de la vente ${sale.invoiceNumber}`,
            },
          });
        }

        return updatedSale;
      });
    } catch (error: any) {
      this.logger.error(`Failed to cancel sale: ${error.message}`);
      throw new InternalServerErrorException("Erreur lors de l'annulation de la vente");
    }
  }
}
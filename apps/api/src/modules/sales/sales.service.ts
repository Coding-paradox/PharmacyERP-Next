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

  constructor(private readonly prisma: PrismaService) {}

  async create(createSaleDto: CreateSaleDto, userId: string) {
    const {
      customerName,
      customerPhone,
      paymentMethod,
      discount = 0,
      tax = 0,
      currency = Currency.CDF,
      notes,
      items,
      pharmacyId,
    } = createSaleDto;

    if (!items || items.length === 0) {
      throw new BadRequestException('La vente doit contenir au moins un article.');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        let totalAmount = 0;
        const saleItems = [];

        // Vérifier les stocks
        for (const item of items) {
          const medicine = await tx.medicine.findUnique({
            where: { id: item.medicineId },
          });

          if (!medicine) {
            throw new NotFoundException(`Médicament ${item.medicineId} non trouvé.`);
          }

          if (medicine.stock < item.quantity) {
            throw new ConflictException(
              `Stock insuffisant pour ${medicine.name}. Disponible: ${medicine.stock}, Demandé: ${item.quantity}`,
            );
          }

          const itemCurrency = item.currency ?? medicine.sellingCurrency;
          if (itemCurrency !== currency) {
            throw new BadRequestException(
              `La devise de ${medicine.name} (${itemCurrency}) ne correspond pas à la devise de la vente (${currency}).`,
            );
          }

          const itemDiscount = item.discount || 0;
          const total = (item.quantity * item.unitPrice) - itemDiscount;
          totalAmount += total;

          saleItems.push({
            medicineId: item.medicineId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: total,
            currency,
            discount: itemDiscount,
          });
        }

        const netAmount = totalAmount;
        const discountAmount = discount || 0;
        const taxAmount = tax || 0;
        const finalTotal = netAmount - discountAmount + taxAmount;

        // Créer la vente
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

        // Mettre à jour les stocks
        for (const item of items) {
          const medicine = await tx.medicine.findUnique({
            where: { id: item.medicineId },
          });

          const newStock = (medicine?.stock || 0) - item.quantity;

          await tx.medicine.update({
            where: { id: item.medicineId },
            data: { stock: newStock },
          });

          await tx.inventoryMovement.create({
            data: {
              medicineId: item.medicineId,
              pharmacyId,
              userId,
              quantity: -item.quantity,
              previousStock: medicine?.stock || 0,
              newStock: newStock,
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

        // Restaurer les stocks
        for (const item of sale.saleItems) {
          const medicine = await tx.medicine.findUnique({
            where: { id: item.medicineId },
          });

          const newStock = (medicine?.stock || 0) + item.quantity;

          await tx.medicine.update({
            where: { id: item.medicineId },
            data: { stock: newStock },
          });

          await tx.inventoryMovement.create({
            data: {
              medicineId: item.medicineId,
              pharmacyId,
              userId: sale.userId,
              quantity: item.quantity,
              previousStock: medicine?.stock || 0,
              newStock: newStock,
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
      throw new InternalServerErrorException('Erreur lors de l\'annulation de la vente');
    }
  }
}

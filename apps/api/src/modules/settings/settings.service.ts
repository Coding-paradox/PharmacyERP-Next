import { Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '@pharmacy/database';
import { UpdatePharmacyDto } from './dto/update-pharmacy.dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPharmacySettings(pharmacyId: string) {
    const pharmacy = await this.prisma.pharmacy.findUnique({
      where: { id: pharmacyId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        taxId: true,
        logo: true,
        timezone: true,
        currency: true,
        isActive: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            medicines: true,
            sales: true,
            purchases: true,
          },
        },
      },
    });

    if (!pharmacy) {
      throw new NotFoundException('Pharmacie non trouvée.');
    }

    return pharmacy;
  }

  async updatePharmacySettings(pharmacyId: string, updatePharmacyDto: UpdatePharmacyDto) {
    try {
      const pharmacy = await this.prisma.pharmacy.update({
        where: { id: pharmacyId },
        data: updatePharmacyDto,
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          email: true,
          taxId: true,
          logo: true,
          timezone: true,
          currency: true,
          isActive: true,
          tenantId: true,
          updatedAt: true,
        },
      });

      this.logger.log(`Pharmacy settings updated: ${pharmacy.name}`);
      return pharmacy;
    } catch (error: any) {
      this.logger.error(`Failed to update pharmacy settings: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la mise à jour des paramètres');
    }
  }

  async getSystemInfo(pharmacyId: string) {
    const [users, medicines, sales, purchases, customers, suppliers] = await Promise.all([
      this.prisma.user.count({ where: { pharmacyId, isActive: true } }),
      this.prisma.medicine.count({ where: { pharmacyId, deletedAt: null } }),
      this.prisma.sale.count({ where: { pharmacyId } }),
      this.prisma.purchase.count({ where: { pharmacyId } }),
      this.prisma.customer.count({ where: { pharmacyId } }),
      this.prisma.supplier.count({ where: { pharmacyId } }),
    ]);

    return {
      users,
      medicines,
      sales,
      purchases,
      customers,
      suppliers,
    };
  }
}
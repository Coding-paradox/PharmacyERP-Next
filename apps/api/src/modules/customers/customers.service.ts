import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@pharmacy/database';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const { name, phone, email, address, currency, pharmacyId } = createCustomerDto;

    try {
      return await this.prisma.customer.create({
        data: {
          name,
          phone: phone || null,
          email: email || null,
          address: address || null,
          currency: currency || 'CDF',
          pharmacyId,
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to create customer: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la création du client');
    }
  }

  async findAll(pharmacyId: string, search?: string) {
    const where: Prisma.CustomerWhereInput = {
      pharmacyId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { sales: true },
        },
      },
    });
  }

  async findOne(id: string, pharmacyId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        pharmacyId,
      },
      include: {
        sales: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: { sales: true },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Client avec l'ID "${id}" non trouvé.`);
    }

    return customer;
  }

  async update(id: string, pharmacyId: string, updateCustomerDto: UpdateCustomerDto) {
    await this.findOne(id, pharmacyId);

    try {
      return await this.prisma.customer.update({
        where: { id },
        data: {
          name: updateCustomerDto.name,
          phone: updateCustomerDto.phone || null,
          email: updateCustomerDto.email || null,
          address: updateCustomerDto.address || null,
          currency: updateCustomerDto.currency || 'CDF',
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to update customer: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la mise à jour du client');
    }
  }

  async remove(id: string, pharmacyId: string) {
    const customer = await this.findOne(id, pharmacyId);

    if (customer._count.sales > 0) {
      throw new ConflictException(
        `Impossible de supprimer ce client car il a ${customer._count.sales} vente(s) associée(s).`,
      );
    }

    try {
      await this.prisma.customer.delete({
        where: { id },
      });
      return { success: true, message: 'Client supprimé avec succès' };
    } catch (error: any) {
      this.logger.error(`Failed to delete customer: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la suppression du client');
    }
  }
}
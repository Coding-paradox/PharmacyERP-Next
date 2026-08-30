import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@pharmacy/database';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createSupplierDto: CreateSupplierDto) {
    const { name, description, email, phone, address, pharmacyId } = createSupplierDto;

    try {
      const existing = await this.prisma.supplier.findFirst({
        where: {
          pharmacyId,
          name: {
            equals: name,
            mode: 'insensitive',
          },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Un fournisseur avec le nom "${name}" existe déjà dans cette pharmacie.`,
        );
      }

      return await this.prisma.supplier.create({
        data: {
          name,
          description,
          email,
          phone,
          address,
          pharmacyId,
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to create supplier: ${error.message}`);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Erreur lors de la création du fournisseur');
    }
  }

  async findAll(pharmacyId: string, search?: string) {
    const where: Prisma.SupplierWhereInput = {
      pharmacyId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { purchases: true },
        },
      },
    });
  }

  async findOne(id: string, pharmacyId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: {
        id,
        pharmacyId,
      },
      include: {
        purchases: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { purchases: true },
        },
      },
    });

    if (!supplier) {
      throw new NotFoundException(`Fournisseur avec l'ID "${id}" non trouvé.`);
    }

    return supplier;
  }

  async update(id: string, pharmacyId: string, updateSupplierDto: UpdateSupplierDto) {
    await this.findOne(id, pharmacyId);

    const { name, description, email, phone, address } = updateSupplierDto;

    if (name) {
      const existing = await this.prisma.supplier.findFirst({
        where: {
          pharmacyId,
          name: {
            equals: name,
            mode: 'insensitive',
          },
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Un fournisseur avec le nom "${name}" existe déjà dans cette pharmacie.`,
        );
      }
    }

    try {
      return await this.prisma.supplier.update({
        where: { id },
        data: {
          name,
          description,
          email,
          phone,
          address,
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to update supplier: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la mise à jour du fournisseur');
    }
  }

  async remove(id: string, pharmacyId: string) {
    const supplier = await this.findOne(id, pharmacyId);

    if (supplier._count.purchases > 0) {
      throw new ConflictException(
        `Impossible de supprimer ce fournisseur car il est utilisé par ${supplier._count.purchases} commande(s) d'achat.`,
      );
    }

    try {
      await this.prisma.supplier.delete({
        where: { id },
      });
      return { success: true, message: 'Fournisseur supprimé avec succès' };
    } catch (error: any) {
      this.logger.error(`Failed to delete supplier: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la suppression du fournisseur');
    }
  }
}
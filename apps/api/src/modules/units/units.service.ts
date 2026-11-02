import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@pharmacy/database';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UnitsService {
  private readonly logger = new Logger(UnitsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createUnitDto: CreateUnitDto, pharmacyId: string) {
    const { name, symbol } = createUnitDto;

    try {
      const existing = await this.prisma.unit.findFirst({
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
          `Une unité avec le nom "${name}" existe déjà dans cette pharmacie.`,
        );
      }

      return await this.prisma.unit.create({
        data: {
          name,
          symbol,
          pharmacyId,
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to create unit: ${error.message}`);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Erreur lors de la création de l\'unité');
    }
  }

  async findAll(pharmacyId: string, search?: string) {
    const where: Prisma.UnitWhereInput = {
      pharmacyId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { symbol: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.unit.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { medicines: { where: { deletedAt: null } } },
        },
      },
    });
  }

  async findOne(id: string, pharmacyId: string) {
    const unit = await this.prisma.unit.findFirst({
      where: {
        id,
        pharmacyId,
      },
      include: {
        medicines: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: { medicines: { where: { deletedAt: null } } },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException(`Unité avec l'ID "${id}" non trouvée.`);
    }

    return unit;
  }

  async update(id: string, pharmacyId: string, updateUnitDto: UpdateUnitDto) {
    await this.findOne(id, pharmacyId);

    const { name, symbol } = updateUnitDto;

    if (name) {
      const existing = await this.prisma.unit.findFirst({
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
          `Une unité avec le nom "${name}" existe déjà dans cette pharmacie.`,
        );
      }
    }

    try {
      return await this.prisma.unit.update({
        where: { id },
        data: {
          name,
          symbol,
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to update unit: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la mise à jour de l\'unité');
    }
  }

  async remove(id: string, pharmacyId: string) {
    await this.findOne(id, pharmacyId);

    try {
      await this.prisma.$transaction(async (tx) => {
        const activeMedicineCount = await tx.medicine.count({
          where: { unitId: id, pharmacyId, deletedAt: null },
        });
        if (activeMedicineCount > 0) {
          throw new ConflictException(
            `Impossible de supprimer cette unité : ${activeMedicineCount} médicament(s) du catalogue l’utilisent encore.`,
          );
        }
        await tx.unit.delete({ where: { id } });
      });
      return { success: true, message: 'Unité supprimée avec succès' };
    } catch (error: any) {
      if (error instanceof ConflictException || error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to delete unit: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la suppression de l\'unité');
    }
  }
}

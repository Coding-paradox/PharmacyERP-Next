import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@pharmacy/database';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const { name, description, pharmacyId } = createCategoryDto;

    try {
      const existing = await this.prisma.category.findFirst({
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
          `Une catégorie avec le nom "${name}" existe déjà dans cette pharmacie.`,
        );
      }

      return await this.prisma.category.create({
        data: {
          name,
          description,
          pharmacyId,
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to create category: ${error.message}`);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Erreur lors de la création de la catégorie');
    }
  }

  async findAll(pharmacyId: string, search?: string) {
    const where: Prisma.CategoryWhereInput = {
      pharmacyId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { medicines: true },
        },
      },
    });
  }

  async findOne(id: string, pharmacyId: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        pharmacyId,
      },
      include: {
        medicines: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: { medicines: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Catégorie avec l'ID "${id}" non trouvée.`);
    }

    return category;
  }

  async update(id: string, pharmacyId: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id, pharmacyId);

    const { name, description } = updateCategoryDto;

    if (name) {
      const existing = await this.prisma.category.findFirst({
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
          `Une catégorie avec le nom "${name}" existe déjà dans cette pharmacie.`,
        );
      }
    }

    try {
      return await this.prisma.category.update({
        where: { id },
        data: {
          name,
          description,
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to update category: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la mise à jour de la catégorie');
    }
  }

  async remove(id: string, pharmacyId: string) {
    const category = await this.findOne(id, pharmacyId);

    if (category._count.medicines > 0) {
      throw new ConflictException(
        `Impossible de supprimer cette catégorie car elle est utilisée par ${category._count.medicines} médicament(s).`,
      );
    }

    try {
      await this.prisma.category.delete({
        where: { id },
      });
      return { success: true, message: 'Catégorie supprimée avec succès' };
    } catch (error: any) {
      this.logger.error(`Failed to delete category: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la suppression de la catégorie');
    }
  }
}
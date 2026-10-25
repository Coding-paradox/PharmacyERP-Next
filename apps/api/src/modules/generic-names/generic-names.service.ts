import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '@pharmacy/database';
import { CreateGenericNameDto } from './dto/create-generic-name.dto';
import { UpdateGenericNameDto } from './dto/update-generic-name.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class GenericNamesService {
  private readonly logger = new Logger(GenericNamesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createGenericNameDto: CreateGenericNameDto, pharmacyId: string) {
    const { name, description } = createGenericNameDto;

    try {
      const existing = await this.prisma.genericName.findFirst({
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
          `Un nom générique avec le nom "${name}" existe déjà dans cette pharmacie.`,
        );
      }

      return await this.prisma.genericName.create({
        data: {
          name,
          description,
          pharmacyId,
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to create generic name: ${error.message}`);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erreur lors de la création du nom générique',
      );
    }
  }

  async findAll(pharmacyId: string) {
    return this.prisma.genericName.findMany({
      where: { pharmacyId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { medicines: true },
        },
      },
    });
  }

  async findOne(id: string, pharmacyId: string) {
    const genericName = await this.prisma.genericName.findFirst({
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

    if (!genericName) {
      throw new NotFoundException(
        `Nom générique avec l'ID "${id}" non trouvé.`,
      );
    }

    return genericName;
  }

  async update(
    id: string,
    pharmacyId: string,
    updateGenericNameDto: UpdateGenericNameDto,
  ) {
    await this.findOne(id, pharmacyId);

    const { name, description } = updateGenericNameDto;

    if (name) {
      const existing = await this.prisma.genericName.findFirst({
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
          `Un nom générique avec le nom "${name}" existe déjà dans cette pharmacie.`,
        );
      }
    }

    try {
      return await this.prisma.genericName.update({
        where: { id },
        data: {
          name,
          description,
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to update generic name: ${error.message}`);
      throw new InternalServerErrorException(
        'Erreur lors de la mise à jour du nom générique',
      );
    }
  }

  async remove(id: string, pharmacyId: string) {
    const genericName = await this.findOne(id, pharmacyId);

    if (genericName._count.medicines > 0) {
      throw new ConflictException(
        `Impossible de supprimer ce nom générique car il est utilisé par ${genericName._count.medicines} médicament(s).`,
      );
    }

    try {
      await this.prisma.genericName.delete({
        where: { id },
      });
      return { success: true, message: 'Nom générique supprimé avec succès' };
    } catch (error: any) {
      this.logger.error(`Failed to delete generic name: ${error.message}`);
      throw new InternalServerErrorException(
        'Erreur lors de la suppression du nom générique',
      );
    }
  }
}
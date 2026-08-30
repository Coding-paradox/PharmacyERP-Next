import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@pharmacy/database';
import { CreateManufacturerDto } from './dto/create-manufacturer.dto';
import { UpdateManufacturerDto } from './dto/update-manufacturer.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ManufacturersService {
  private readonly logger = new Logger(ManufacturersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createManufacturerDto: CreateManufacturerDto) {
    const { name, country, email, phone, pharmacyId } = createManufacturerDto;

    try {
      const existing = await this.prisma.manufacturer.findFirst({
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
          `Un fabricant avec le nom "${name}" existe déjà dans cette pharmacie.`,
        );
      }

      return await this.prisma.manufacturer.create({
        data: {
          name,
          country,
          email,
          phone,
          pharmacyId,
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to create manufacturer: ${error.message}`);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Erreur lors de la création du fabricant');
    }
  }

  async findAll(pharmacyId: string, search?: string) {
    const where: Prisma.ManufacturerWhereInput = {
      pharmacyId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.manufacturer.findMany({
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
    const manufacturer = await this.prisma.manufacturer.findFirst({
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

    if (!manufacturer) {
      throw new NotFoundException(`Fabricant avec l'ID "${id}" non trouvé.`);
    }

    return manufacturer;
  }

  async update(id: string, pharmacyId: string, updateManufacturerDto: UpdateManufacturerDto) {
    await this.findOne(id, pharmacyId);

    const { name, country, email, phone } = updateManufacturerDto;

    if (name) {
      const existing = await this.prisma.manufacturer.findFirst({
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
          `Un fabricant avec le nom "${name}" existe déjà dans cette pharmacie.`,
        );
      }
    }

    try {
      return await this.prisma.manufacturer.update({
        where: { id },
        data: {
          name,
          country,
          email,
          phone,
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to update manufacturer: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la mise à jour du fabricant');
    }
  }

  async remove(id: string, pharmacyId: string) {
    const manufacturer = await this.findOne(id, pharmacyId);

    if (manufacturer._count.medicines > 0) {
      throw new ConflictException(
        `Impossible de supprimer ce fabricant car il est utilisé par ${manufacturer._count.medicines} médicament(s).`,
      );
    }

    try {
      await this.prisma.manufacturer.delete({
        where: { id },
      });
      return { success: true, message: 'Fabricant supprimé avec succès' };
    } catch (error: any) {
      this.logger.error(`Failed to delete manufacturer: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la suppression du fabricant');
    }
  }
}
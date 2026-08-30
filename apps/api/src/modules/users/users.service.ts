import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@pharmacy/database';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password, firstName, lastName, phone, role, isActive, pharmacyId } = createUserDto;

    const existing = await this.prisma.user.findFirst({
      where: {
        email,
        pharmacyId,
      },
    });

    if (existing) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà dans cette pharmacie.');
    }

    const hashedPassword = await argon2.hash(password);

    try {
      return await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone: phone || null,
          role: role || 'VIEWER',
          isActive: isActive !== undefined ? isActive : true,
          pharmacyId,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          pharmacyId: true,
          createdAt: true,
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to create user: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la création de l\'utilisateur');
    }
  }

  async findAll(pharmacyId: string, search?: string) {
    const where: Prisma.UserWhereInput = {
      pharmacyId,
    };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        pharmacyId: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            sales: true,
            purchases: true,
          },
        },
      },
    });
  }

  async findOne(id: string, pharmacyId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        pharmacyId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        pharmacyId: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
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
        purchases: {
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
      },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID "${id}" non trouvé.`);
    }

    return user;
  }

  async update(id: string, pharmacyId: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id, pharmacyId);

    const { email, password, firstName, lastName, phone, role, isActive } = updateUserDto;

    const data: any = {
      firstName,
      lastName,
      phone: phone || null,
      role,
      isActive,
    };

    if (email) {
      const existing = await this.prisma.user.findFirst({
        where: {
          email,
          pharmacyId,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('Cet email est déjà utilisé par un autre utilisateur.');
      }
      data.email = email;
    }

    if (password) {
      data.password = await argon2.hash(password);
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          pharmacyId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to update user: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la mise à jour de l\'utilisateur');
    }
  }

  async remove(id: string, pharmacyId: string) {
    await this.findOne(id, pharmacyId);

    try {
      await this.prisma.user.delete({
        where: { id },
      });
      return { success: true, message: 'Utilisateur supprimé avec succès' };
    } catch (error: any) {
      this.logger.error(`Failed to delete user: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la suppression de l\'utilisateur');
    }
  }
}
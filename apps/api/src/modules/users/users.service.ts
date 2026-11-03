import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@pharmacy/database';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';

export interface ActorContext {
  id: string;
  role: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, pharmacyId: string, actorRole: string) {
    const { email, password, firstName, lastName, phone, role, isActive } = createUserDto;

    if (role === 'ADMIN' && actorRole !== 'ADMIN') {
      throw new ForbiddenException('Seul un administrateur peut créer un autre administrateur.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await this.prisma.user.findFirst({
      where: {
        email: normalizedEmail,
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
          email: normalizedEmail,
          password: hashedPassword,
          firstName,
          lastName,
          phone: phone || null,
          role: (role as any) || 'VIEWER',
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
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Un utilisateur avec cet email existe déjà dans cette pharmacie.');
      }
      this.logger.error(`Failed to create user: ${error.message}`);
      throw new InternalServerErrorException("Erreur lors de la création de l'utilisateur");
    }
  }

  async findAll(pharmacyId: string, search?: string) {
    const where: Prisma.UserWhereInput = {
      pharmacyId,
    };

    if (search?.trim()) {
      const term = search.trim();
      where.OR = [
        { email: { contains: term, mode: 'insensitive' } },
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
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

  async update(id: string, pharmacyId: string, updateUserDto: UpdateUserDto, actor?: ActorContext) {
    const target = await this.findOne(id, pharmacyId);

    const { email, password, firstName, lastName, phone, role, isActive } = updateUserDto;

    if (role !== undefined && role !== target.role) {
      if (actor?.id === id) {
        throw new BadRequestException('Vous ne pouvez pas modifier votre propre rôle.');
      }
      if ((role === 'ADMIN' || target.role === 'ADMIN') && actor?.role !== 'ADMIN') {
        throw new ForbiddenException("Seul un administrateur peut modifier un rôle ADMIN.");
      }
    }

    if (isActive === false && actor?.id === id) {
      throw new BadRequestException('Vous ne pouvez pas désactiver votre propre compte.');
    }

    const data: any = {
      firstName,
      lastName,
      phone: phone || null,
      role,
      isActive,
    };

    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      const existing = await this.prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          pharmacyId,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('Cet email est déjà utilisé par un autre utilisateur.');
      }
      data.email = normalizedEmail;
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
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Cet email est déjà utilisé par un autre utilisateur.');
      }
      this.logger.error(`Failed to update user: ${error.message}`);
      throw new InternalServerErrorException("Erreur lors de la mise à jour de l'utilisateur");
    }
  }

  async remove(id: string, pharmacyId: string, actor?: ActorContext) {
    const target = await this.findOne(id, pharmacyId);

    if (actor?.id === id) {
      throw new BadRequestException('Vous ne pouvez pas supprimer votre propre compte.');
    }
    if (target.role === 'ADMIN' && actor?.role !== 'ADMIN') {
      throw new ForbiddenException('Seul un administrateur peut supprimer un administrateur.');
    }

    try {
      await this.prisma.user.delete({
        where: { id },
      });
      return { success: true, message: 'Utilisateur supprimé avec succès' };
    } catch (error: any) {
      this.logger.error(`Failed to delete user: ${error.message}`);
      throw new InternalServerErrorException("Erreur lors de la suppression de l'utilisateur");
    }
  }
}
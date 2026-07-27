import { Injectable, ConflictException, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';
import { QueryParamsDto, SortOrder } from '../common/dto/query-params.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import * as crypto from 'crypto';

@Injectable()
export class MedicineService {
  constructor(private prisma: PrismaService) {}

  private generateStructuredCode(): string {
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `MED-${randomSuffix}`;
  }

  private validatePriceRule(costPrice?: number, sellingPrice?: number) {
    if (costPrice !== undefined && sellingPrice !== undefined) {
      if (sellingPrice < costPrice) {
        throw new BadRequestException("Le prix de vente (sellingPrice) ne peut pas être inférieur au prix d'achat (costPrice).");
      }
    }
  }

  async create(createMedicineDto: CreateMedicineDto, pharmacy_id: string = 'default'): Promise<any> {
    this.validatePriceRule(createMedicineDto.costPrice, createMedicineDto.sellingPrice);

    let code = createMedicineDto.code;
    if (!code) {
      code = this.generateStructuredCode();
      let existing = await this.prisma.medicine.findFirst({ where: { pharmacy_id, code, deletedAt: null } });
      while (existing) {
        code = this.generateStructuredCode();
        existing = await this.prisma.medicine.findFirst({ where: { pharmacy_id, code, deletedAt: null } });
      }
    } else {
      const existing = await this.prisma.medicine.findFirst({ where: { pharmacy_id, code, deletedAt: null } });
      if (existing) {
        throw new ConflictException(`Un médicament avec le code '${code}' existe déjà pour cette pharmacie.`);
      }
    }

    if (createMedicineDto.barcode) {
      const existingBarcode = await this.prisma.medicine.findFirst({
        where: { pharmacy_id, barcode: createMedicineDto.barcode, deletedAt: null },
      });
      if (existingBarcode) {
        throw new ConflictException(`Le code-barres '${createMedicineDto.barcode}' est déjà attribué à un autre produit.`);
      }
    }

    try {
      return await this.prisma.medicine.create({
        data: {
          ...createMedicineDto,
          code,
          pharmacy_id,
        } as any,
        include: {
          category: true,
          manufacturer: true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException("Erreur d'unicité : un champ unique existe déjà.");
      }
      throw new InternalServerErrorException('Erreur lors de la création du médicament.');
    }
  }

  async findAll(query: QueryParamsDto, pharmacy_id: string = 'default'): Promise<PaginatedResponseDto<any>> {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = SortOrder.DESC } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      pharmacy_id,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { genericName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.medicine.count({ where }),
      this.prisma.medicine.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: true,
          manufacturer: true,
        },
      }),
    ]);

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string, pharmacy_id: string = 'default'): Promise<any> {
    const medicine = await this.prisma.medicine.findFirst({
      where: { id, pharmacy_id, deletedAt: null },
      include: {
        category: true,
        manufacturer: true,
      },
    });

    if (!medicine) {
      throw new NotFoundException(`Médicament avec l'ID '${id}' introuvable.`);
    }

    return medicine;
  }

  async update(id: string, updateMedicineDto: UpdateMedicineDto, pharmacy_id: string = 'default'): Promise<any> {
    const existingMedicine = await this.findOne(id, pharmacy_id);

    const costPrice = updateMedicineDto.costPrice !== undefined ? updateMedicineDto.costPrice : Number(existingMedicine.costPrice);
    const sellingPrice = updateMedicineDto.sellingPrice !== undefined ? updateMedicineDto.sellingPrice : Number(existingMedicine.sellingPrice);
    this.validatePriceRule(costPrice, sellingPrice);

    if (updateMedicineDto.code) {
      const existingCode = await this.prisma.medicine.findFirst({
        where: { pharmacy_id, code: updateMedicineDto.code, deletedAt: null, NOT: { id } },
      });
      if (existingCode) {
        throw new ConflictException(`Le code '${updateMedicineDto.code}' est déjà utilisé par un autre médicament.`);
      }
    }

    if (updateMedicineDto.barcode) {
      const existingBarcode = await this.prisma.medicine.findFirst({
        where: { pharmacy_id, barcode: updateMedicineDto.barcode, deletedAt: null, NOT: { id } },
      });
      if (existingBarcode) {
        throw new ConflictException(`Le code-barres '${updateMedicineDto.barcode}' est déjà utilisé par un autre médicament.`);
      }
    }

    try {
      return await this.prisma.medicine.update({
        where: { id },
        data: updateMedicineDto as any,
        include: {
          category: true,
          manufacturer: true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException("Erreur de contrainte d'unicité lors de la mise à jour.");
      }
      throw new InternalServerErrorException('Erreur lors de la mise à jour du médicament.');
    }
  }

  async remove(id: string, pharmacy_id: string = 'default'): Promise<any> {
    await this.findOne(id, pharmacy_id);

    return this.prisma.medicine.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }
}
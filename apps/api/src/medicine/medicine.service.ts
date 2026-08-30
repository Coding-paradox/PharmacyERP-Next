import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@pharmacy/database';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';
import { QueryParamsDto } from '@pharmacy/shared/dto/pagination.dto';
import { PaginatedResponseDto } from '@pharmacy/shared/dto/pagination.dto';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class MedicineService {
  private readonly logger = new Logger(MedicineService.name);

  constructor(private readonly prisma: PrismaService) {}

  private generateStructuredCode(): string {
    const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `MED-${randomSuffix}`;
  }

  private validatePriceRule(costPrice?: number, sellingPrice?: number): void {
    if (costPrice !== undefined && sellingPrice !== undefined) {
      if (sellingPrice < costPrice) {
        throw new BadRequestException(
          'Selling price cannot be less than cost price',
        );
      }
    }
  }

  private async generateUniqueCode(pharmacyId: string): Promise<string> {
    let code: string;
    let exists: boolean;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = this.generateStructuredCode();
      exists = (await this.prisma.medicine.findFirst({
        where: {
          pharmacyId,
          code,
          deletedAt: null,
        },
        select: { id: true },
      })) !== null;
      attempts++;
    } while (exists && attempts < maxAttempts);

    if (exists) {
      throw new InternalServerErrorException('Unable to generate unique code');
    }

    return code;
  }

  async create(
    createMedicineDto: CreateMedicineDto,
    pharmacyId: string,
  ): Promise<any> {
    // Vérification de la règle de prix
    this.validatePriceRule(
      createMedicineDto.costPrice,
      createMedicineDto.sellingPrice,
    );

    // Génération du code
    const code = createMedicineDto.code || (await this.generateUniqueCode(pharmacyId));

    // Vérification du code unique
    if (createMedicineDto.code) {
      const existing = await this.prisma.medicine.findFirst({
        where: {
          pharmacyId,
          code: createMedicineDto.code,
          deletedAt: null,
        },
      });
      if (existing) {
        throw new ConflictException(
          `Medicine with code '${createMedicineDto.code}' already exists`,
        );
      }
    }

    // Vérification du barcode
    if (createMedicineDto.barcode) {
      const existingBarcode = await this.prisma.medicine.findFirst({
        where: {
          pharmacyId,
          barcode: createMedicineDto.barcode,
          deletedAt: null,
        },
      });
      if (existingBarcode) {
        throw new ConflictException(
          `Barcode '${createMedicineDto.barcode}' already assigned`,
        );
      }
    }

    try {
      const medicine = await this.prisma.medicine.create({
        data: {
          code,
          barcode: createMedicineDto.barcode || null,
          name: createMedicineDto.name,
          genericNameId: createMedicineDto.genericNameId || null,
          dosageId: createMedicineDto.dosageId || null,
          dosageFormId: createMedicineDto.dosageFormId || null,
          categoryId: createMedicineDto.categoryId || null,
          manufacturerId: createMedicineDto.manufacturerId || null,
          unitId: createMedicineDto.unitId || null,
          costPrice: createMedicineDto.costPrice ?? 0,
          sellingPrice: createMedicineDto.sellingPrice ?? 0,
          minStock: createMedicineDto.minStock ?? 5,
          isActive: createMedicineDto.isActive ?? true,
          pharmacyId,
        },
        include: {
          category: true,
          manufacturer: true,
          unit: true,
          genericName: true,
          dosage: true,
          dosageForm: true,
        },
      });

      this.logger.log(`Medicine created: ${medicine.code} - ${medicine.name}`);
      return medicine;
    } catch (error: any) {
      this.logger.error(`Failed to create medicine: ${error.message}`);
      
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `A medicine with this ${error.meta?.target?.[0] || 'field'} already exists`
          );
        }
        if (error.code === 'P2003') {
          throw new BadRequestException(
            `Invalid reference: ${error.meta?.field_name || 'related entity not found'}`
          );
        }
      }
      
      throw new InternalServerErrorException(
        'Failed to create medicine. Please check the data and try again.'
      );
    }
  }

  async findAll(
    query: QueryParamsDto,
    pharmacyId: string,
  ): Promise<PaginatedResponseDto<any>> {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const where: Prisma.MedicineWhereInput = {
      pharmacyId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { genericName: { name: { contains: search, mode: 'insensitive' } } },
        { dosage: { name: { contains: search, mode: 'insensitive' } } },
        { dosageForm: { name: { contains: search, mode: 'insensitive' } } },
        { category: { name: { contains: search, mode: 'insensitive' } } },
        { manufacturer: { name: { contains: search, mode: 'insensitive' } } },
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
          unit: true,
          genericName: true,
          dosage: true,
          dosageForm: true,
        },
      }),
    ]);

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string, pharmacyId: string): Promise<any> {
    const medicine = await this.prisma.medicine.findFirst({
      where: {
        id,
        pharmacyId,
        deletedAt: null,
      },
      include: {
        category: true,
        manufacturer: true,
        unit: true,
        genericName: true,
        dosage: true,
        dosageForm: true,
      },
    });

    if (!medicine) {
      throw new NotFoundException(`Medicine with ID '${id}' not found`);
    }

    return medicine;
  }

  async findByBarcode(barcode: string, pharmacyId: string): Promise<any> {
    const medicine = await this.prisma.medicine.findFirst({
      where: {
        barcode,
        pharmacyId,
        deletedAt: null,
      },
      include: {
        category: true,
        manufacturer: true,
        unit: true,
        genericName: true,
        dosage: true,
        dosageForm: true,
      },
    });

    if (!medicine) {
      throw new NotFoundException(
        `Medicine with barcode '${barcode}' not found`,
      );
    }

    return medicine;
  }

  async update(
    id: string,
    updateMedicineDto: UpdateMedicineDto,
    pharmacyId: string,
  ): Promise<any> {
    const existingMedicine = await this.findOne(id, pharmacyId);

    const costPrice = updateMedicineDto.costPrice ?? existingMedicine.costPrice;
    const sellingPrice =
      updateMedicineDto.sellingPrice ?? existingMedicine.sellingPrice;
    this.validatePriceRule(costPrice, sellingPrice);

    if (updateMedicineDto.code) {
      const existingCode = await this.prisma.medicine.findFirst({
        where: {
          pharmacyId,
          code: updateMedicineDto.code,
          deletedAt: null,
          NOT: { id },
        },
      });
      if (existingCode) {
        throw new ConflictException(
          `Code '${updateMedicineDto.code}' already in use`,
        );
      }
    }

    if (updateMedicineDto.barcode) {
      const existingBarcode = await this.prisma.medicine.findFirst({
        where: {
          pharmacyId,
          barcode: updateMedicineDto.barcode,
          deletedAt: null,
          NOT: { id },
        },
      });
      if (existingBarcode) {
        throw new ConflictException(
          `Barcode '${updateMedicineDto.barcode}' already in use`,
        );
      }
    }

    try {
      const medicine = await this.prisma.medicine.update({
        where: { id },
        data: {
          code: updateMedicineDto.code,
          barcode: updateMedicineDto.barcode,
          name: updateMedicineDto.name,
          genericNameId: updateMedicineDto.genericNameId || null,
          dosageId: updateMedicineDto.dosageId || null,
          dosageFormId: updateMedicineDto.dosageFormId || null,
          categoryId: updateMedicineDto.categoryId || null,
          manufacturerId: updateMedicineDto.manufacturerId || null,
          unitId: updateMedicineDto.unitId || null,
          costPrice: updateMedicineDto.costPrice ?? existingMedicine.costPrice,
          sellingPrice: updateMedicineDto.sellingPrice ?? existingMedicine.sellingPrice,
          minStock: updateMedicineDto.minStock ?? existingMedicine.minStock,
          isActive: updateMedicineDto.isActive ?? existingMedicine.isActive,
        },
        include: {
          category: true,
          manufacturer: true,
          unit: true,
          genericName: true,
          dosage: true,
          dosageForm: true,
        },
      });

      this.logger.log(`Medicine updated: ${medicine.code} - ${medicine.name}`);
      return medicine;
    } catch (error: any) {
      this.logger.error(`Failed to update medicine: ${error.message}`);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `A medicine with this ${error.meta?.target?.[0] || 'field'} already exists`
          );
        }
        if (error.code === 'P2003') {
          throw new BadRequestException(
            `Invalid reference: ${error.meta?.field_name || 'related entity not found'}`
          );
        }
      }
      throw new InternalServerErrorException('Failed to update medicine');
    }
  }

  async remove(id: string, pharmacyId: string): Promise<any> {
    await this.findOne(id, pharmacyId);

    this.logger.log(`Medicine removed: ${id}`);
    return this.prisma.medicine.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }
}
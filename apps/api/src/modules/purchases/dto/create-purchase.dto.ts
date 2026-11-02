import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
  IsEnum,
  IsArray,
  ValidateNested,
  IsDate,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Currency, OrderStatus } from '@prisma/client';

export class CreatePurchaseItemDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  medicineId!: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 100.50 })
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @ApiPropertyOptional({ enum: Currency, default: Currency.CDF })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiProperty({ example: '2027-12-31T00:00:00Z' })
  @Type(() => Date)
  @IsDate()
  expiryDate?: Date;

  @ApiProperty({ example: 'BATCH-001' })
  @IsString()
  @IsNotEmpty()
  batchNumber?: string;
}

export class CreatePurchaseDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiProperty({ example: 'MediPharma S.A.' })
  @IsString()
  supplierName!: string;

  @ApiPropertyOptional({ example: '+243 81 234 5678' })
  @IsOptional()
  @IsString()
  supplierPhone?: string;

  @ApiPropertyOptional({ example: 'FACT-FOURNISSEUR-2026-1042' })
  @IsOptional()
  @IsString()
  supplierInvoiceNumber?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @ApiPropertyOptional({ enum: Currency, default: Currency.CDF })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({ example: 'Commande urgente' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreatePurchaseItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items!: CreatePurchaseItemDto[];

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  pharmacyId!: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  Min,
  IsUUID,
  MaxLength,
  IsPositive,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Currency } from '@prisma/client';

/**
 * Convertit une chaîne vide ('') en `undefined` avant validation.
 *
 * Nécessaire car @IsOptional() de class-validator ne saute la validation
 * que pour `undefined`/`null`, jamais pour une chaîne vide. Sans ce
 * transform, un <select> HTML laissé sur sa valeur par défaut ('') fait
 * échouer @IsUUID() et renvoie une 400, même si le frontend est corrigé
 * (défense en profondeur : l'API ne doit pas dépendre uniquement du
 * frontend pour ce genre de normalisation).
 */
const emptyStringToUndefined = () =>
  Transform(({ value }) => (value === '' ? undefined : value));

export class CreateMedicineDto {
  @ApiPropertyOptional({
    example: 'MED-PAR-500',
    description: 'Unique medicine code (auto-generated if not provided)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Category ID',
  })
  @emptyStringToUndefined()
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Manufacturer ID',
  })
  @emptyStringToUndefined()
  @IsUUID()
  @IsOptional()
  manufacturerId?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unit of measure ID',
  })
  @emptyStringToUndefined()
  @IsUUID()
  @IsOptional()
  unitId?: string;

  @ApiPropertyOptional({
    example: '5412345678900',
    description: 'Unique barcode',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  barcode?: string;

  @ApiProperty({ example: 'Paracetamol', description: 'Commercial name' })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Generic Name ID',
  })
  @emptyStringToUndefined()
  @IsUUID()
  @IsOptional()
  genericNameId?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Dosage ID',
  })
  @emptyStringToUndefined()
  @IsUUID()
  @IsOptional()
  dosageId?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Dosage Form ID',
  })
  @emptyStringToUndefined()
  @IsUUID()
  @IsOptional()
  dosageFormId?: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Minimum stock alert threshold',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minStock?: number;

  @ApiPropertyOptional({
    example: 1.50,
    description: 'Cost price per unit',
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  costPrice?: number;

  @ApiPropertyOptional({
    enum: Currency,
    default: Currency.CDF,
    description: 'Currency used for the cost price (CDF or USD)',
  })
  @emptyStringToUndefined()
  @IsEnum(Currency)
  @IsOptional()
  costCurrency?: Currency;

  @ApiPropertyOptional({
    example: 2.50,
    description: 'Selling price per unit',
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  sellingPrice?: number;

  @ApiPropertyOptional({
    enum: Currency,
    default: Currency.CDF,
    description: 'Currency used for the selling price (CDF or USD)',
  })
  @emptyStringToUndefined()
  @IsEnum(Currency)
  @IsOptional()
  sellingCurrency?: Currency;

  @ApiPropertyOptional({
    example: true,
    description: 'Product active status',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Pharmacy ID (tenant)',
  })
  @IsUUID()
  pharmacyId!: string;
}
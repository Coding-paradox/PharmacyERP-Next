import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  IsUUID,
  MaxLength,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

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
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Manufacturer ID',
  })
  @IsUUID()
  @IsOptional()
  manufacturerId?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unit of measure ID',
  })
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
    example: 'Acetaminophen',
    description: 'Generic name',
  })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  genericName?: string;

  @ApiPropertyOptional({
    example: '500mg',
    description: 'Dosage strength',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  dosage?: string;

  @ApiPropertyOptional({
    example: 'Tablet',
    description: 'Dosage form',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  dosageForm?: string;

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
    example: 2.50,
    description: 'Selling price per unit',
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @IsOptional()
  sellingPrice?: number;

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
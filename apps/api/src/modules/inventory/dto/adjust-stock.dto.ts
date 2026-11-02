import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsString, IsOptional, Min, IsEnum, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { InventoryMovementType } from '@prisma/client';

export class AdjustStockDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  medicineId!: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @IsInt()
  @Min(0)
  quantity!: number;

  @ApiProperty({ enum: InventoryMovementType })
  @IsEnum(InventoryMovementType)
  movementType!: InventoryMovementType;

  @ApiPropertyOptional({ example: 'Ajustement manuel' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Lot ciblé pour un retrait ou une correction négative' })
  @IsOptional()
  @IsUUID()
  medicineBatchId?: string;

  @ApiPropertyOptional({ example: 'LOT-2026-01' })
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({ example: '2027-12-31T00:00:00Z' })
  @IsOptional()
  @Type(() => Date)
  expiryDate?: Date;
}

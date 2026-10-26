import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsString, IsOptional, Min, IsEnum, IsInt } from 'class-validator';
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
}
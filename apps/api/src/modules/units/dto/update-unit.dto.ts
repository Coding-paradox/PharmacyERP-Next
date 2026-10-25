import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsUUID } from 'class-validator';

export class UpdateUnitDto {
  @ApiPropertyOptional({ example: 'Comprimé' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ example: 'cp' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  symbol?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID de la pharmacie (tenant)',
  })
  @IsUUID()
  @IsOptional()
  pharmacyId?: string;
}
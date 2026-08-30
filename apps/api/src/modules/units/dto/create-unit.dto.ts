import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateUnitDto {
  @ApiProperty({ example: 'Comprimé' })
  @IsString()
  @MaxLength(50)
  name!: string;

  @ApiPropertyOptional({ example: 'cp' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  symbol?: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  pharmacyId!: string;
}
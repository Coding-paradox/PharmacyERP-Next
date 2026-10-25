import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsUUID } from 'class-validator';

export class CreateGenericNameDto {
  @ApiProperty({ example: 'Paracétamol', description: 'Nom du générique' })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({
    example: 'Antalgique et antipyrétique de première intention',
    description: 'Description du générique',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID de la pharmacie (tenant)',
  })
  @IsUUID()
  pharmacyId!: string;
}
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateManufacturerDto {
  @ApiProperty({ example: 'Pfizer' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'USA' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ example: 'contact@pfizer.com' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({ example: '+1 234 567 890' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  pharmacyId!: string;
}
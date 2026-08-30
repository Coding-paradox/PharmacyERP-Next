import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateSupplierDto {
  @ApiPropertyOptional({ example: 'MediPharma S.A.' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Fournisseur de médicaments génériques' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ example: 'contact@medipharma.com' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({ example: '+243 81 234 5678' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ example: '123 Avenue de la Santé, Kinshasa' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;
}
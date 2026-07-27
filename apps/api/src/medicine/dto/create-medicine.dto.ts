import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max, IsUUID, MaxLength } from 'class-validator';

export class CreateMedicineDto {
  @ApiPropertyOptional({ example: 'MED-PAR-500', description: 'Code unique du médicament' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ example: '38100000-0000-0000-0000-000000000000', description: 'ID de la catégorie' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: '38100000-0000-0000-0000-000000000000', description: 'ID du fabricant' })
  @IsUUID()
  @IsOptional()
  manufacturerId?: string;

  @ApiPropertyOptional({ example: '38100000-0000-0000-0000-000000000000', description: "ID de l'unité de mesure" })
  @IsUUID()
  @IsOptional()
  unitId?: string;

  @ApiPropertyOptional({ example: '5412345678900', description: 'Code barre unique' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  barcode?: string;

  @ApiProperty({ example: 'Paracétamol', description: 'Nom commercial du médicament' })
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ example: 'Acetaminophen', description: 'Nom générique' })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  genericName?: string;

  @ApiPropertyOptional({ example: '500mg', description: 'Dosage' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  dosage?: string;

  @ApiPropertyOptional({ example: 'Comprimé', description: 'Forme galénique' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  dosageForm?: string;

  @ApiPropertyOptional({ example: 10, description: "Seuil d'alerte de stock minimum" })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minStock?: number;

  @ApiPropertyOptional({ example: 1.50, description: "Prix d'achat unitaire (Cost Price)" })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costPrice?: number;

  @ApiPropertyOptional({ example: 2.50, description: 'Prix de vente unitaire (Selling Price)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  sellingPrice?: number;

  @ApiPropertyOptional({ example: true, description: 'Statut actif du produit' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
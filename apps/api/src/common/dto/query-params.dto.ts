import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, IsString, IsEnum, Max } from 'class-validator';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class QueryParamsDto {
  @ApiPropertyOptional({ example: 1, description: 'Numéro de la page (commence à 1)', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: "Nombre d'éléments par page", default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'paracetamol', description: 'Terme de recherche global' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: 'createdAt', description: 'Champ sur lequel appliquer le tri', default: 'createdAt' })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: SortOrder, example: SortOrder.DESC, description: 'Direction du tri (asc ou desc)', default: SortOrder.DESC })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;
}

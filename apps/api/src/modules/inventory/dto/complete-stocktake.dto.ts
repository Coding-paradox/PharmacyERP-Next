import { Type } from 'class-transformer';
import { IsArray, IsDate, IsInt, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';

export class CountedStocktakeItemDto {
  @IsUUID()
  itemId!: string;

  @IsInt()
  @Min(0)
  countedQuantity!: number;

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiryDate?: Date;
}

export class CompleteStocktakeDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CountedStocktakeItemDto)
  items!: CountedStocktakeItemDto[];
}

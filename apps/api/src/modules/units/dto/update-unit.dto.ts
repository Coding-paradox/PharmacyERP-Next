import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

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
}
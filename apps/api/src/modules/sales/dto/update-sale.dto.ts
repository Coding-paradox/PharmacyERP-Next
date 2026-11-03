import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateSaleDto {
  @ApiPropertyOptional({ example: 'Annulé par le client' })
  @IsOptional()
  @IsString()
  notes?: string;
}

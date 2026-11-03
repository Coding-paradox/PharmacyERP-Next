import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdatePurchaseDto {
  @ApiPropertyOptional({ example: 'Commande annulée' })
  @IsOptional()
  @IsString()
  notes?: string;
}

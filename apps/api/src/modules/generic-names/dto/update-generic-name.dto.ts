import { PartialType } from '@nestjs/swagger';
import { CreateGenericNameDto } from './create-generic-name.dto';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateGenericNameDto extends PartialType(CreateGenericNameDto) {
  @IsUUID()
  @IsOptional()
  id?: string;
}
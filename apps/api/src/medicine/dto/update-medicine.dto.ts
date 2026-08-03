import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateMedicineDto } from './create-medicine.dto';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateMedicineDto extends PartialType(
  OmitType(CreateMedicineDto, ['pharmacyId'] as const),
) {
  @IsUUID()
  @IsOptional()
  id?: string;
}
import { CreateMedicineDto } from './create-medicine.dto';
declare const UpdateMedicineDto_base: import("@nestjs/common").Type<Partial<Omit<CreateMedicineDto, "pharmacyId">>>;
export declare class UpdateMedicineDto extends UpdateMedicineDto_base {
    id?: string;
}
export {};

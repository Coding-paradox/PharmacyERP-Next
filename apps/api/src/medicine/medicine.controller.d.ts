import { MedicineService } from './medicine.service';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';
import { QueryParamsDto } from '@pharmacy/shared/dto/pagination.dto';
import { ApiResponseDto } from '@pharmacy/shared/dto/api-response.dto';
export declare class MedicineController {
    private readonly medicineService;
    constructor(medicineService: MedicineService);
    create(createMedicineDto: CreateMedicineDto): Promise<ApiResponseDto>;
    findAll(queryParams: QueryParamsDto): Promise<ApiResponseDto>;
    findOne(id: string): Promise<ApiResponseDto>;
    update(id: string, updateMedicineDto: UpdateMedicineDto): Promise<ApiResponseDto>;
    remove(id: string): Promise<ApiResponseDto>;
    findByBarcode(barcode: string): Promise<ApiResponseDto>;
}

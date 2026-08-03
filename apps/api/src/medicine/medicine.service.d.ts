import { PrismaService } from '@pharmacy/database';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';
import { QueryParamsDto } from '@pharmacy/shared/dto/pagination.dto';
import { PaginatedResponseDto } from '@pharmacy/shared/dto/pagination.dto';
export declare class MedicineService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private generateStructuredCode;
    private validatePriceRule;
    private generateUniqueCode;
    create(createMedicineDto: CreateMedicineDto, pharmacyId: string): Promise<any>;
    findAll(query: QueryParamsDto, pharmacyId: string): Promise<PaginatedResponseDto<any>>;
    findOne(id: string, pharmacyId: string): Promise<any>;
    findByBarcode(barcode: string, pharmacyId: string): Promise<any>;
    update(id: string, updateMedicineDto: UpdateMedicineDto, pharmacyId: string): Promise<any>;
    remove(id: string, pharmacyId: string): Promise<any>;
    checkStock(id: string, pharmacyId: string): Promise<number>;
    updateStock(id: string, quantity: number, pharmacyId: string): Promise<any>;
}

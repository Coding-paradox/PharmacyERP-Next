export declare class CreateMedicineDto {
    code?: string;
    categoryId?: string;
    manufacturerId?: string;
    unitId?: string;
    barcode?: string;
    name: string;
    genericName?: string;
    dosage?: string;
    dosageForm?: string;
    minStock?: number;
    costPrice?: number;
    sellingPrice?: number;
    isActive?: boolean;
    pharmacyId: string;
}

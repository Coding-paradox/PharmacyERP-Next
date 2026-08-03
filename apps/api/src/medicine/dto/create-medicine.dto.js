"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMedicineDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateMedicineDto {
    code;
    categoryId;
    manufacturerId;
    unitId;
    barcode;
    name;
    genericName;
    dosage;
    dosageForm;
    minStock;
    costPrice;
    sellingPrice;
    isActive;
    pharmacyId;
}
exports.CreateMedicineDto = CreateMedicineDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'MED-PAR-500',
        description: 'Unique medicine code (auto-generated if not provided)',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateMedicineDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Category ID',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMedicineDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Manufacturer ID',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMedicineDto.prototype, "manufacturerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Unit of measure ID',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateMedicineDto.prototype, "unitId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '5412345678900',
        description: 'Unique barcode',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateMedicineDto.prototype, "barcode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Paracetamol', description: 'Commercial name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CreateMedicineDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Acetaminophen',
        description: 'Generic name',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CreateMedicineDto.prototype, "genericName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '500mg',
        description: 'Dosage strength',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateMedicineDto.prototype, "dosage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Tablet',
        description: 'Dosage form',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateMedicineDto.prototype, "dosageForm", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 10,
        description: 'Minimum stock alert threshold',
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateMedicineDto.prototype, "minStock", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 1.50,
        description: 'Cost price per unit',
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateMedicineDto.prototype, "costPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 2.50,
        description: 'Selling price per unit',
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateMedicineDto.prototype, "sellingPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: true,
        description: 'Product active status',
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateMedicineDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Pharmacy ID (tenant)',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateMedicineDto.prototype, "pharmacyId", void 0);
//# sourceMappingURL=create-medicine.dto.js.map
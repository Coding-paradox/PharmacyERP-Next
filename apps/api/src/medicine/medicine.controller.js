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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicineController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const medicine_service_1 = require("./medicine.service");
const create_medicine_dto_1 = require("./dto/create-medicine.dto");
const update_medicine_dto_1 = require("./dto/update-medicine.dto");
const pagination_dto_1 = require("@pharmacy/shared/dto/pagination.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let MedicineController = class MedicineController {
    medicineService;
    constructor(medicineService) {
        this.medicineService = medicineService;
    }
    async create(createMedicineDto) {
        const data = await this.medicineService.create(createMedicineDto);
        return {
            success: true,
            message: 'Medicine created successfully',
            data,
            statusCode: common_1.HttpStatus.CREATED,
        };
    }
    async findAll(queryParams) {
        const result = await this.medicineService.findAll(queryParams);
        return {
            success: true,
            message: 'Medicines retrieved successfully',
            data: result.data,
            meta: result.meta,
            statusCode: common_1.HttpStatus.OK,
        };
    }
    async findOne(id) {
        const data = await this.medicineService.findOne(id);
        return {
            success: true,
            message: 'Medicine retrieved successfully',
            data,
            statusCode: common_1.HttpStatus.OK,
        };
    }
    async update(id, updateMedicineDto) {
        const data = await this.medicineService.update(id, updateMedicineDto);
        return {
            success: true,
            message: 'Medicine updated successfully',
            data,
            statusCode: common_1.HttpStatus.OK,
        };
    }
    async remove(id) {
        await this.medicineService.remove(id);
        return {
            success: true,
            message: 'Medicine deleted successfully',
            data: null,
            statusCode: common_1.HttpStatus.OK,
        };
    }
    async findByBarcode(barcode) {
        const data = await this.medicineService.findByBarcode(barcode);
        return {
            success: true,
            message: 'Medicine retrieved successfully',
            data,
            statusCode: common_1.HttpStatus.OK,
        };
    }
};
exports.MedicineController = MedicineController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'PHARMACIST'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new medicine' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Medicine created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_medicine_dto_1.CreateMedicineDto]),
    __metadata("design:returntype", Promise)
], MedicineController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'PHARMACIST', 'CASHIER', 'VIEWER'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all medicines with pagination' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Medicines retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'sortBy', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof pagination_dto_1.QueryParamsDto !== "undefined" && pagination_dto_1.QueryParamsDto) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], MedicineController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'PHARMACIST', 'CASHIER', 'VIEWER'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a medicine by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Medicine retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Medicine not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MedicineController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'PHARMACIST'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a medicine' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Medicine updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Medicine not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_medicine_dto_1.UpdateMedicineDto]),
    __metadata("design:returntype", Promise)
], MedicineController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a medicine' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Medicine deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Medicine not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MedicineController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('barcode/:barcode'),
    (0, roles_decorator_1.Roles)('ADMIN', 'PHARMACIST', 'CASHIER'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a medicine by barcode' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Medicine retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Medicine not found' }),
    __param(0, (0, common_1.Param)('barcode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MedicineController.prototype, "findByBarcode", null);
exports.MedicineController = MedicineController = __decorate([
    (0, swagger_1.ApiTags)('Medicines'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('medicines'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [medicine_service_1.MedicineService])
], MedicineController);
//# sourceMappingURL=medicine.controller.js.map
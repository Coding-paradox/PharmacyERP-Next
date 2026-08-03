"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MedicineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicineService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@pharmacy/database");
const pagination_dto_1 = require("@pharmacy/shared/dto/pagination.dto");
const client_1 = require("@prisma/client");
const crypto = __importStar(require("crypto"));
let MedicineService = MedicineService_1 = class MedicineService {
    prisma;
    logger = new common_1.Logger(MedicineService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    generateStructuredCode() {
        const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
        return `MED-${randomSuffix}`;
    }
    validatePriceRule(costPrice, sellingPrice) {
        if (costPrice !== undefined && sellingPrice !== undefined) {
            if (sellingPrice < costPrice) {
                throw new common_1.BadRequestException('Selling price cannot be less than cost price');
            }
        }
    }
    async generateUniqueCode(pharmacyId) {
        let code;
        let exists;
        let attempts = 0;
        const maxAttempts = 10;
        do {
            code = this.generateStructuredCode();
            exists = await this.prisma.medicine.findFirst({
                where: {
                    pharmacyId,
                    code,
                    deletedAt: null,
                },
                select: { id: true },
            }) !== null;
            attempts++;
        } while (exists && attempts < maxAttempts);
        if (exists) {
            throw new common_1.InternalServerErrorException('Unable to generate unique code');
        }
        return code;
    }
    async create(createMedicineDto, pharmacyId) {
        this.validatePriceRule(createMedicineDto.costPrice, createMedicineDto.sellingPrice);
        const code = createMedicineDto.code || await this.generateUniqueCode(pharmacyId);
        if (createMedicineDto.code) {
            const existing = await this.prisma.medicine.findFirst({
                where: {
                    pharmacyId,
                    code: createMedicineDto.code,
                    deletedAt: null,
                },
            });
            if (existing) {
                throw new common_1.ConflictException(`Medicine with code '${createMedicineDto.code}' already exists`);
            }
        }
        if (createMedicineDto.barcode) {
            const existingBarcode = await this.prisma.medicine.findFirst({
                where: {
                    pharmacyId,
                    barcode: createMedicineDto.barcode,
                    deletedAt: null,
                },
            });
            if (existingBarcode) {
                throw new common_1.ConflictException(`Barcode '${createMedicineDto.barcode}' already assigned`);
            }
        }
        try {
            return await this.prisma.medicine.create({
                data: {
                    ...createMedicineDto,
                    code,
                    pharmacyId,
                    isActive: true,
                },
                include: {
                    category: true,
                    manufacturer: true,
                },
            });
        }
        catch (error) {
            this.logger.error(`Failed to create medicine: ${error.message}`);
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new common_1.ConflictException('Unique constraint violation');
                }
            }
            throw new common_1.InternalServerErrorException('Failed to create medicine');
        }
    }
    async findAll(query, pharmacyId) {
        const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc', } = query;
        const skip = (page - 1) * limit;
        const where = {
            pharmacyId,
            deletedAt: null,
        };
        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { genericName: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [total, data] = await Promise.all([
            this.prisma.medicine.count({ where }),
            this.prisma.medicine.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    category: true,
                    manufacturer: true,
                    stock: true,
                },
            }),
        ]);
        return new pagination_dto_1.PaginatedResponseDto(data, total, page, limit);
    }
    async findOne(id, pharmacyId) {
        const medicine = await this.prisma.medicine.findFirst({
            where: {
                id,
                pharmacyId,
                deletedAt: null,
            },
            include: {
                category: true,
                manufacturer: true,
                stock: true,
            },
        });
        if (!medicine) {
            throw new common_1.NotFoundException(`Medicine with ID '${id}' not found`);
        }
        return medicine;
    }
    async findByBarcode(barcode, pharmacyId) {
        const medicine = await this.prisma.medicine.findFirst({
            where: {
                barcode,
                pharmacyId,
                deletedAt: null,
            },
            include: {
                category: true,
                manufacturer: true,
                stock: true,
            },
        });
        if (!medicine) {
            throw new common_1.NotFoundException(`Medicine with barcode '${barcode}' not found`);
        }
        return medicine;
    }
    async update(id, updateMedicineDto, pharmacyId) {
        const existingMedicine = await this.findOne(id, pharmacyId);
        const costPrice = updateMedicineDto.costPrice ?? existingMedicine.costPrice;
        const sellingPrice = updateMedicineDto.sellingPrice ?? existingMedicine.sellingPrice;
        this.validatePriceRule(costPrice, sellingPrice);
        if (updateMedicineDto.code) {
            const existingCode = await this.prisma.medicine.findFirst({
                where: {
                    pharmacyId,
                    code: updateMedicineDto.code,
                    deletedAt: null,
                    NOT: { id },
                },
            });
            if (existingCode) {
                throw new common_1.ConflictException(`Code '${updateMedicineDto.code}' already in use`);
            }
        }
        if (updateMedicineDto.barcode) {
            const existingBarcode = await this.prisma.medicine.findFirst({
                where: {
                    pharmacyId,
                    barcode: updateMedicineDto.barcode,
                    deletedAt: null,
                    NOT: { id },
                },
            });
            if (existingBarcode) {
                throw new common_1.ConflictException(`Barcode '${updateMedicineDto.barcode}' already in use`);
            }
        }
        try {
            return await this.prisma.medicine.update({
                where: { id },
                data: updateMedicineDto,
                include: {
                    category: true,
                    manufacturer: true,
                    stock: true,
                },
            });
        }
        catch (error) {
            this.logger.error(`Failed to update medicine: ${error.message}`);
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new common_1.ConflictException('Unique constraint violation');
                }
            }
            throw new common_1.InternalServerErrorException('Failed to update medicine');
        }
    }
    async remove(id, pharmacyId) {
        await this.findOne(id, pharmacyId);
        return this.prisma.medicine.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isActive: false,
            },
        });
    }
    async checkStock(id, pharmacyId) {
        const medicine = await this.findOne(id, pharmacyId);
        return medicine.stock?.quantity || 0;
    }
    async updateStock(id, quantity, pharmacyId) {
        await this.findOne(id, pharmacyId);
        return this.prisma.medicine.update({
            where: { id },
            data: {
                stock: {
                    update: {
                        quantity: { increment: quantity },
                    },
                },
            },
            include: {
                stock: true,
            },
        });
    }
};
exports.MedicineService = MedicineService;
exports.MedicineService = MedicineService = MedicineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.PrismaService])
], MedicineService);
//# sourceMappingURL=medicine.service.js.map
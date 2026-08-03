"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
class BaseRepository {
    prisma;
    modelName;
    constructor(prisma, modelName) {
        this.prisma = prisma;
        this.modelName = modelName;
    }
    get model() {
        return this.prisma[this.modelName];
    }
    async create(data, tx) {
        const client = tx || this.model;
        return client.create({ data });
    }
    async createMany(data, tx) {
        const client = tx || this.model;
        return client.createMany({ data });
    }
    async findAll(options, includeDeleted = false, tx) {
        const client = tx || this.model;
        const where = includeDeleted
            ? options?.where
            : { ...options?.where, deletedAt: null };
        return client.findMany({
            ...options,
            where,
        });
    }
    async findPaginated(options, includeDeleted = false, tx) {
        const client = tx || this.model;
        const page = options.page || 1;
        const limit = Math.min(options.limit || 20, 100);
        const skip = (page - 1) * limit;
        const where = includeDeleted
            ? options.where
            : { ...options?.where, deletedAt: null };
        const [data, total] = await Promise.all([
            client.findMany({
                ...options,
                where,
                skip,
                take: limit,
            }),
            client.count({ where }),
        ]);
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findById(id, include, includeDeleted = false, tx) {
        const client = tx || this.model;
        const where = { id };
        if (!includeDeleted) {
            where.deletedAt = null;
        }
        return client.findFirst({
            where,
            include,
        });
    }
    async findFirst(where, include, includeDeleted = false, tx) {
        const client = tx || this.model;
        const finalWhere = includeDeleted
            ? where
            : { ...where, deletedAt: null };
        return client.findFirst({
            where: finalWhere,
            include,
        });
    }
    async findUnique(where, include, includeDeleted = false, tx) {
        const client = tx || this.model;
        return client.findUnique({
            where,
            include,
        });
    }
    async update(id, data, tx) {
        const client = tx || this.model;
        return client.update({
            where: { id },
            data,
        });
    }
    async updateMany(where, data, tx) {
        const client = tx || this.model;
        return client.updateMany({
            where,
            data,
        });
    }
    async softDelete(id, tx) {
        const client = tx || this.model;
        return client.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async softDeleteMany(where, tx) {
        const client = tx || this.model;
        return client.updateMany({
            where,
            data: { deletedAt: new Date() },
        });
    }
    async hardDelete(id, tx) {
        const client = tx || this.model;
        return client.delete({
            where: { id },
        });
    }
    async hardDeleteMany(where, tx) {
        const client = tx || this.model;
        return client.deleteMany({
            where,
        });
    }
    async count(where, includeDeleted = false, tx) {
        const client = tx || this.model;
        const finalWhere = includeDeleted
            ? where
            : { ...where, deletedAt: null };
        return client.count({ where: finalWhere });
    }
    async exists(where, includeDeleted = false, tx) {
        const count = await this.count(where, includeDeleted, tx);
        return count > 0;
    }
    async transaction(fn) {
        return this.prisma.transaction(fn);
    }
}
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=base.repository.js.map
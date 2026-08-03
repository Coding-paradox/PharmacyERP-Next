import { PrismaService } from '@pharmacy/database';
import { Prisma } from '@prisma/client';
export interface FindOptions<WhereInput, IncludeInput, SelectInput> {
    where?: WhereInput;
    include?: IncludeInput;
    select?: SelectInput;
    orderBy?: any;
    skip?: number;
    take?: number;
    cursor?: any;
}
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export declare abstract class BaseRepository<T, CreateInput, UpdateInput, WhereUniqueInput, WhereInput, IncludeInput = any, SelectInput = any> {
    protected readonly prisma: PrismaService;
    protected readonly modelName: string;
    constructor(prisma: PrismaService, modelName: keyof PrismaService);
    protected get model(): any;
    create(data: CreateInput, tx?: Prisma.TransactionClient): Promise<T>;
    createMany(data: CreateInput[], tx?: Prisma.TransactionClient): Promise<Prisma.BatchPayload>;
    findAll(options?: FindOptions<WhereInput, IncludeInput, SelectInput>, includeDeleted?: boolean, tx?: Prisma.TransactionClient): Promise<T[]>;
    findPaginated(options: FindOptions<WhereInput, IncludeInput, SelectInput> & {
        page?: number;
        limit?: number;
    }, includeDeleted?: boolean, tx?: Prisma.TransactionClient): Promise<PaginatedResult<T>>;
    findById(id: string, include?: IncludeInput, includeDeleted?: boolean, tx?: Prisma.TransactionClient): Promise<T | null>;
    findFirst(where: WhereInput, include?: IncludeInput, includeDeleted?: boolean, tx?: Prisma.TransactionClient): Promise<T | null>;
    findUnique(where: WhereUniqueInput, include?: IncludeInput, includeDeleted?: boolean, tx?: Prisma.TransactionClient): Promise<T | null>;
    update(id: string, data: UpdateInput, tx?: Prisma.TransactionClient): Promise<T>;
    updateMany(where: WhereInput, data: UpdateInput, tx?: Prisma.TransactionClient): Promise<Prisma.BatchPayload>;
    softDelete(id: string, tx?: Prisma.TransactionClient): Promise<T>;
    softDeleteMany(where: WhereInput, tx?: Prisma.TransactionClient): Promise<Prisma.BatchPayload>;
    hardDelete(id: string, tx?: Prisma.TransactionClient): Promise<T>;
    hardDeleteMany(where: WhereInput, tx?: Prisma.TransactionClient): Promise<Prisma.BatchPayload>;
    count(where?: WhereInput, includeDeleted?: boolean, tx?: Prisma.TransactionClient): Promise<number>;
    exists(where: WhereInput, includeDeleted?: boolean, tx?: Prisma.TransactionClient): Promise<boolean>;
    transaction<TResult>(fn: (tx: Prisma.TransactionClient) => Promise<TResult>): Promise<TResult>;
}

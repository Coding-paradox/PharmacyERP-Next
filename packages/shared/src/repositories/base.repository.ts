import { PrismaService } from '@pharmacy/database';

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

export abstract class BaseRepository<
  T,
  CreateInput,
  UpdateInput,
  WhereUniqueInput,
  WhereInput,
  IncludeInput = any,
  SelectInput = any
> {
  protected readonly modelName: string;

  constructor(
    protected readonly prisma: PrismaService,
    modelName: string,
  ) {
    this.modelName = modelName;
  }

  protected get model(): any {
    return this.prisma[this.modelName as keyof PrismaService];
  }

  async create(data: CreateInput, tx?: any): Promise<T> {
    const client = tx || this.model;
    return client.create({ data });
  }

  async createMany(data: CreateInput[], tx?: any): Promise<any> {
    const client = tx || this.model;
    return client.createMany({ data });
  }

  async findAll(
    options?: FindOptions<WhereInput, IncludeInput, SelectInput>,
    includeDeleted = false,
    tx?: any,
  ): Promise<T[]> {
    const client = tx || this.model;
    const where = includeDeleted
      ? options?.where
      : { ...options?.where, deletedAt: null };

    return client.findMany({
      ...options,
      where,
    });
  }

  async findPaginated(
    options: FindOptions<WhereInput, IncludeInput, SelectInput> & { page?: number; limit?: number },
    includeDeleted = false,
    tx?: any,
  ): Promise<PaginatedResult<T>> {
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

  async findById(
    id: string,
    include?: IncludeInput,
    includeDeleted = false,
    tx?: any,
  ): Promise<T | null> {
    const client = tx || this.model;
    const where: any = { id };
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    return client.findFirst({
      where,
      include,
    });
  }

  async findFirst(
    where: WhereInput,
    include?: IncludeInput,
    includeDeleted = false,
    tx?: any,
  ): Promise<T | null> {
    const client = tx || this.model;
    const finalWhere = includeDeleted
      ? where
      : { ...where, deletedAt: null };
    return client.findFirst({
      where: finalWhere,
      include,
    });
  }

  async findUnique(
    where: WhereUniqueInput,
    include?: IncludeInput,
    includeDeleted = false,
    tx?: any,
  ): Promise<T | null> {
    const client = tx || this.model;
    return client.findUnique({
      where,
      include,
    });
  }

  async update(
    id: string,
    data: UpdateInput,
    tx?: any,
  ): Promise<T> {
    const client = tx || this.model;
    return client.update({
      where: { id },
      data,
    });
  }

  async updateMany(
    where: WhereInput,
    data: UpdateInput,
    tx?: any,
  ): Promise<any> {
    const client = tx || this.model;
    return client.updateMany({
      where,
      data,
    });
  }

  async softDelete(id: string, tx?: any): Promise<T> {
    const client = tx || this.model;
    return client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async softDeleteMany(
    where: WhereInput,
    tx?: any,
  ): Promise<any> {
    const client = tx || this.model;
    return client.updateMany({
      where,
      data: { deletedAt: new Date() },
    });
  }

  async hardDelete(id: string, tx?: any): Promise<T> {
    const client = tx || this.model;
    return client.delete({
      where: { id },
    });
  }

  async hardDeleteMany(
    where: WhereInput,
    tx?: any,
  ): Promise<any> {
    const client = tx || this.model;
    return client.deleteMany({
      where,
    });
  }

  async count(
    where?: WhereInput,
    includeDeleted = false,
    tx?: any,
  ): Promise<number> {
    const client = tx || this.model;
    const finalWhere = includeDeleted
      ? where
      : { ...where, deletedAt: null };
    return client.count({ where: finalWhere });
  }

  async exists(
    where: WhereInput,
    includeDeleted = false,
    tx?: any,
  ): Promise<boolean> {
    const count = await this.count(where, includeDeleted, tx);
    return count > 0;
  }

  async transaction<TResult>(
    fn: (tx: any) => Promise<TResult>,
  ): Promise<TResult> {
    return this.prisma.transaction(fn);
  }
}
import { PrismaService } from '../prisma/prisma.service';

export interface FindOptions<WhereInput, IncludeInput> {
  where?: WhereInput;
  include?: IncludeInput;
  orderBy?: any;
  skip?: number;
  take?: number;
}

export abstract class BaseRepository<T, CreateInput, UpdateInput, WhereUniqueInput, WhereInput, IncludeInput> {
  protected constructor(
    protected readonly prisma: PrismaService,
    protected readonly modelName: keyof PrismaService,
  ) {}

  protected get model(): any {
    return this.prisma[this.modelName];
  }

  async create(data: CreateInput, tx?: any): Promise<T> {
    const client = tx || this.model;
    return client.create({ data });
  }

  async findAll(options?: FindOptions<WhereInput, IncludeInput>, includeDeleted = false, tx?: any): Promise<T[]> {
    const client = tx || this.model;
    const where = includeDeleted ? options?.where : { ...options?.where, deletedAt: null };
    return client.findMany({
      ...options,
      where,
    });
  }

  async findById(id: string, include?: IncludeInput, includeDeleted = false, tx?: any): Promise<T | null> {
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

  async update(id: string, data: UpdateInput, tx?: any): Promise<T> {
    const client = tx || this.model;
    return client.update({
      where: { id },
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

  async hardDelete(id: string, tx?: any): Promise<T> {
    const client = tx || this.model;
    return client.delete({
      where: { id },
    });
  }
}
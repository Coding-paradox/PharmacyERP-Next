import { PrismaClient } from '@prisma/client';

export class BaseRepository<T> {
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly modelName: string,
  ) {}

  async findAll(params?: { skip?: number; take?: number; cursor?: any; where?: any; orderBy?: any }): Promise<T[]> {
    return (this.prisma as any)[this.modelName].findMany(params);
  }

  async findById(id: number | string): Promise<T | null> {
    return (this.prisma as any)[this.modelName].findUnique({
      where: { id },
    });
  }

  async create(data: any): Promise<T> {
    return (this.prisma as any)[this.modelName].create({
      data,
    });
  }

  async update(id: number | string, data: any): Promise<T> {
    return (this.prisma as any)[this.modelName].update({
      where: { id },
      data,
    });
  }

  async delete(id: number | string): Promise<T> {
    return (this.prisma as any)[this.modelName].delete({
      where: { id },
    });
  }
}
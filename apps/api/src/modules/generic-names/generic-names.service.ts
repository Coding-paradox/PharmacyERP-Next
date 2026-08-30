import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@pharmacy/database';

@Injectable()
export class GenericNamesService {
  private readonly logger = new Logger(GenericNamesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(pharmacyId: string) {
    return this.prisma.genericName.findMany({
      where: { pharmacyId },
      orderBy: { name: 'asc' },
    });
  }
}
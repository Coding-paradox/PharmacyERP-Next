import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@pharmacy/database';

@Injectable()
export class DosagesService {
  private readonly logger = new Logger(DosagesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(pharmacyId: string) {
    return this.prisma.dosage.findMany({
      where: { pharmacyId },
      orderBy: { name: 'asc' },
    });
  }
}
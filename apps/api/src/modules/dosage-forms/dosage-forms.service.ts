import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@pharmacy/database';

@Injectable()
export class DosageFormsService {
  private readonly logger = new Logger(DosageFormsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(pharmacyId: string) {
    return this.prisma.dosageForm.findMany({
      where: { pharmacyId },
      orderBy: { name: 'asc' },
    });
  }
}
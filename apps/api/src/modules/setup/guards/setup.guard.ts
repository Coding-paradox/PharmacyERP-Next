import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@pharmacy/database';

@Injectable()
export class SetupGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const pharmacyCount = await this.prisma.pharmacy.count();

    if (pharmacyCount > 0) {
      throw new ConflictException(
        'System already initialized. Setup is not allowed.',
      );
    }

    return true;
  }
}
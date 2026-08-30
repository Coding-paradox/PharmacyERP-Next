import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@pharmacy/database';
import { AuthService } from '../auth/auth.service';
import { SetupInitialDto } from './dto/setup-initial.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SetupService {
  private readonly logger = new Logger(SetupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async initialize(setupDto: SetupInitialDto) {
    const { pharmacy, admin } = setupDto;

    try {
      this.logger.log('Starting setup process...');

      // Créer la pharmacie et l'utilisateur dans une transaction
      const result = await this.prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          const tenantId = `tenant-${Date.now()}`;

          const newPharmacy = await tx.pharmacy.create({
            data: {
              name: pharmacy.name,
              address: pharmacy.address || null,
              phone: pharmacy.phone || null,
              email: pharmacy.email || null,
              taxId: pharmacy.taxId || null,
              timezone: pharmacy.timezone || 'Africa/Kinshasa',
              currency: pharmacy.currency || 'CDF',
              isActive: true,
              tenantId,
            },
          });

          this.logger.log(`Pharmacy created: ${newPharmacy.name} (${newPharmacy.id})`);

          const hashedPassword = await this.authService.hashPassword(
            admin.password,
          );

          const newUser = await tx.user.create({
            data: {
              email: admin.email,
              password: hashedPassword,
              firstName: admin.firstName,
              lastName: admin.lastName,
              role: 'ADMIN',
              isActive: true,
              pharmacyId: newPharmacy.id,
            },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              pharmacyId: true,
              isActive: true,
            },
          });

          this.logger.log(`Admin user created: ${newUser.email}`);

          // Retourner les données nécessaires pour générer les tokens en dehors de la transaction
          return {
            user: newUser,
            pharmacy: {
              id: newPharmacy.id,
              name: newPharmacy.name,
              tenantId: newPharmacy.tenantId,
            },
          };
        },
      );

      // Générer les tokens en dehors de la transaction
      this.logger.log('Generating tokens...');
      const tokens = await this.authService.generateTokens(
        result.user.id,
        result.user.email,
        result.user.pharmacyId,
        result.user.role,
      );

      this.logger.log('Setup completed successfully!');

      return {
        user: result.user,
        pharmacy: result.pharmacy,
        tokens,
      };
    } catch (error: any) {
      this.logger.error(`Setup failed: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to initialize system: ${error.message}`);
    }
  }

  async isSystemInitialized(): Promise<boolean> {
    const count = await this.prisma.pharmacy.count();
    return count > 0;
  }
}
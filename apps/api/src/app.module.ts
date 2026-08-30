import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@pharmacy/database';
import { AuthModule } from './modules/auth';
import { SetupModule } from './modules/setup';
import { CategoriesModule } from './modules/categories';
import { UnitsModule } from './modules/units';
import { ManufacturersModule } from './modules/manufacturers';
import { SuppliersModule } from './modules/suppliers';
import { PurchasesModule } from './modules/purchases';
import { SalesModule } from './modules/sales';
import { InventoryModule } from './modules/inventory';
import { UsersModule } from './modules/users';
import { CustomersModule } from './modules/customers';
import { SettingsModule } from './modules/settings';
import { ReportsModule } from './modules/reports';
import { EmailModule } from './modules/email';
import { PermissionsModule } from './modules/permissions';
import { MedicineModule } from './medicine/medicine.module';
import configuration from '@pharmacy/shared/config/configuration';
import { validationSchema } from '@pharmacy/shared/config/validation.schema';
import { GenericNamesModule } from './modules/generic-names';
import { DosagesModule } from './modules/dosages';
import { DosageFormsModule } from './modules/dosage-forms';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env', 'apps/api/.env'],
      load: [configuration],
      validationSchema,
    }),
    PrismaModule,
    AuthModule,
    SetupModule,
    CategoriesModule,
    UnitsModule,
    ManufacturersModule,
    SuppliersModule,
    PurchasesModule,
    SalesModule,
    InventoryModule,
    UsersModule,
    CustomersModule,
    SettingsModule,
    ReportsModule,
    EmailModule,
    PermissionsModule,
    MedicineModule,
    GenericNamesModule,
    DosagesModule,
    DosageFormsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
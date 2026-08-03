import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@pharmacy/database';
import { AuthModule } from './modules/auth';
import { MedicineModule } from './medicine/medicine.module';
import configuration from '@pharmacy/shared/config/configuration';
import { validationSchema } from '@pharmacy/shared/config/validation.schema';

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
    MedicineModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
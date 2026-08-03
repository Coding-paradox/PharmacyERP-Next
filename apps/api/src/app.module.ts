import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@pharmacy/database';
import { MedicineModule } from './medicine/medicine.module';
import configuration from '@pharmacy/shared/config/configuration';
import { validationSchema } from '@pharmacy/shared/config/validation.schema';
import { existsSync } from 'fs';
import { join } from 'path';

console.log('===== ENV DIAGNOSTIC =====');
console.log('CWD =', process.cwd());
console.log('ROOT .env =', existsSync(join(process.cwd(), '.env')));
console.log('API .env =', existsSync(join(process.cwd(), 'apps/api/.env')));
console.log('DATABASE_URL =', process.env.DATABASE_URL);
console.log('JWT_ACCESS_SECRET =', process.env.JWT_ACCESS_SECRET ? 'present' : 'missing');
console.log('JWT_REFRESH_SECRET =', process.env.JWT_REFRESH_SECRET ? 'present' : 'missing');
console.log('==========================');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    PrismaModule,
    MedicineModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
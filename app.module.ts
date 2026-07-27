import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MedicineModule } from './src/medicine/medicine.module';
import { MedicineController } from './src/medicine/medicine.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    MedicineModule,
  ],
  controllers: [MedicineController],
})
export class AppModule {}

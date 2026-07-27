import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@packages/database';
import configuration from '@packages/shared/config/configuration';
import { validationSchema } from '@packages/shared/config/validation.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    PrismaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
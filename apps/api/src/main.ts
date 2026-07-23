import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3001);
  console.log('🚀 Backend PharmacyERP-Next prêt sur http://localhost:3001');
}
bootstrap();
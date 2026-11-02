import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, RequestMethod } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  app.use(helmet());

  const configuredOrigins = (
    process.env.CORS_ORIGIN || 'http://localhost:3002,http://127.0.0.1:3002'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (process.env.NODE_ENV === 'production' && configuredOrigins.includes('*')) {
    throw new Error('CORS_ORIGIN doit contenir des origines explicites en production.');
  }

  app.enableCors({
    origin: configuredOrigins.includes('*') ? '*' : configuredOrigins,
    credentials: !configuredOrigins.includes('*'),
  });

  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`PharmacyERP API running on port: ${port}`);
}

bootstrap();

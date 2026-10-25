import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import {
  ValidationPipe,
  Logger,
  HttpException,
  HttpStatus,
  RequestMethod,
} from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configuredOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3002')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

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

  app.useGlobalFilters({
    catch: (exception: any, host: any) => {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();
      const status =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
      const exceptionResponse =
        exception instanceof HttpException ? exception.getResponse() : null;
      const message =
        typeof exceptionResponse === 'object' && exceptionResponse !== null
          ? (exceptionResponse as { message?: string | string[] }).message
          : exception.message;

      response.status(status).json({
        statusCode: status,
        message: message || 'Internal server error',
        ...(process.env.NODE_ENV !== 'production' && { stack: exception.stack }),
      });
    },
  } as any);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`PharmacyERP API running on port: ${port}`);
}

bootstrap();
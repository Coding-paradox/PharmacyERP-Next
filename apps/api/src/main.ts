import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from '@packages/shared/filters/prisma-exception.filter'; // Ajustez l'alias ou le chemin relatif selon vos tsconfig paths

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Sécurité HTTP avec Helmet
  app.use(helmet());

  // Activation du CORS
  app.enableCors({
    origin: '*', // À restreindre en production
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Préfixe global pour toutes les routes de l'API
  app.setGlobalPrefix('api/v1');

  // Validation globale des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Filtre global pour les erreurs Prisma
  app.useGlobalFilters(new PrismaExceptionFilter());

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 PharmacyERP API en cours d'exécution sur le port : ${port}`);
}
bootstrap();
import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erreur interne du serveur de base de données';

    switch (exception.code) {
      case 'P2002': // Violation de contrainte d'unicité (ex: doublon d'email ou de code produit)
        status = HttpStatus.CONFLICT;
        const target = (exception.meta?.target as string[])?.join(', ') || 'champ';
        message = `Conflit de données : un enregistrement existe déjà pour ${target}.`;
        break;
      case 'P2025': // Enregistrement non trouvé pour une mise à jour ou suppression
        status = HttpStatus.NOT_FOUND;
        message = 'Enregistrement non trouvé.';
        break;
      case 'P2003': // Violation de clé étrangère
        status = HttpStatus.BAD_REQUEST;
        message = 'Erreur de relation : la ressource liée est introuvable.';
        break;
      default:
        break;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      error: exception.code,
    });
  }
}
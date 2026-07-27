import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = (request.headers['x-request-id'] as string) || 'unknown';

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erreur interne du serveur';
    let error = 'Internal Server Error';
    let details: any = null;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const errorResponse = exception.getResponse();
      
      if (typeof errorResponse === 'object' && errorResponse !== null) {
        const errObj = errorResponse as Record<string, any>;
        message = Array.isArray(errObj.message) 
          ? errObj.message.join(', ') 
          : (errObj.message || exception.message);
        error = errObj.error || exception.name;
        if (Array.isArray(errObj.message)) {
          details = errObj.message;
          message = 'Erreur de validation des données';
          error = 'Bad Request';
        }
      } else if (typeof errorResponse === 'string') {
        message = errorResponse;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      statusCode = HttpStatus.BAD_REQUEST;
      error = 'Prisma Database Error';

      switch (exception.code) {
        case 'P2002':
          const target = (exception.meta?.target as string[]) || 'champ';
          statusCode = HttpStatus.CONFLICT;
          error = 'Conflict Exception';
          message = `Conflit de données : un enregistrement avec cette valeur existe déjà (${target}).`;
          break;
        case 'P2025':
          statusCode = HttpStatus.NOT_FOUND;
          error = 'Not Found';
          message = 'Ressource introuvable dans la base de données.';
          break;
        default:
          message = `Erreur de base de données (Code: ${exception.code})`;
          break;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    this.logger.error(
      `[Path: ${request.url}] [Method: ${request.method}] [StatusCode: ${statusCode}] [RequestId: ${requestId}] - Message: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      error,
      ...(details ? { details } : {}),
      timestamp: new Date().toISOString(),
      requestId,
    });
  }
}
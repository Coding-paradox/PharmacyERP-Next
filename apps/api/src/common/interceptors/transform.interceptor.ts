import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { ApiResponseDto } from '../dto/api-response.dto';
import { Request } from 'express';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponseDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponseDto<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();

    const requestId = (request.headers['x-request-id'] as string) || uuidv4();
    request.headers['x-request-id'] = requestId;

    const response = ctx.getResponse();
    if (response && typeof response.setHeader === 'function') {
      response.setHeader('X-Request-ID', requestId);
    }

    return next.handle().pipe(
      map((responseBody) => {
        let data = responseBody;
        let meta = undefined;
        let message = 'Opération effectuée avec succès';

        if (responseBody && typeof responseBody === 'object' && 'data' in responseBody && 'meta' in responseBody) {
          data = responseBody.data;
          meta = responseBody.meta;
          if ('message' in responseBody && typeof responseBody.message === 'string') {
            message = responseBody.message;
          }
        }

        return {
          success: true,
          message,
          data: data !== undefined ? data : null,
          ...(meta ? { meta } : {}),
          timestamp: new Date().toISOString(),
          requestId,
        };
      }),
    );
  }
}
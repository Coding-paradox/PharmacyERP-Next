import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response.statusCode || HttpStatus.OK;

    return next.handle().pipe(
      map((data) => {
        // If data already has a message, use it; otherwise use default
        const message = data?.message || 'Operation successful';
        
        // If data has a meta property (for pagination), include it
        const responseData = data?.data !== undefined ? data.data : data;
        const meta = data?.meta || undefined;

        const result: Response<T> = {
          success: true,
          message,
          data: responseData,
          statusCode,
          timestamp: new Date().toISOString(),
        };

        if (meta) {
          (result as any).meta = meta;
        }

        return result;
      }),
    );
  }
}
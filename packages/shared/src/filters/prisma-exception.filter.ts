import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error occurred';

    this.logger.error(`Prisma error ${exception.code}: ${exception.message}`);

    switch (exception.code) {
      case 'P2000':
        status = HttpStatus.BAD_REQUEST;
        message = 'The provided value is too long for the field.';
        break;
      case 'P2001':
        status = HttpStatus.NOT_FOUND;
        message = 'The record searched for in the where condition does not exist.';
        break;
      case 'P2002':
        status = HttpStatus.CONFLICT;
        const target = (exception.meta?.target as string[])?.join(', ') || 'field';
        message = `Unique constraint violation on ${target}.`;
        break;
      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = 'Foreign key constraint failed.';
        break;
      case 'P2004':
        status = HttpStatus.BAD_REQUEST;
        message = 'A constraint failed on the database.';
        break;
      case 'P2005':
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid value for the field type.';
        break;
      case 'P2006':
        status = HttpStatus.BAD_REQUEST;
        message = 'The provided value is invalid for the field.';
        break;
      case 'P2007':
        status = HttpStatus.BAD_REQUEST;
        message = 'Data validation error.';
        break;
      case 'P2008':
        status = HttpStatus.BAD_REQUEST;
        message = 'Failed to parse the query.';
        break;
      case 'P2009':
        status = HttpStatus.BAD_REQUEST;
        message = 'Failed to validate the query.';
        break;
      case 'P2010':
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Raw query failed.';
        break;
      case 'P2011':
        status = HttpStatus.BAD_REQUEST;
        message = 'Null constraint violation.';
        break;
      case 'P2012':
        status = HttpStatus.BAD_REQUEST;
        message = 'Missing required value.';
        break;
      case 'P2013':
        status = HttpStatus.BAD_REQUEST;
        message = 'Missing required argument.';
        break;
      case 'P2014':
        status = HttpStatus.BAD_REQUEST;
        message = 'Required relation violation.';
        break;
      case 'P2015':
        status = HttpStatus.NOT_FOUND;
        message = 'Related record not found.';
        break;
      case 'P2016':
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Query interpretation error.';
        break;
      case 'P2017':
        status = HttpStatus.BAD_REQUEST;
        message = 'The records for relation are not connected.';
        break;
      case 'P2018':
        status = HttpStatus.BAD_REQUEST;
        message = 'The required connected records were not found.';
        break;
      case 'P2019':
        status = HttpStatus.BAD_REQUEST;
        message = 'Input error.';
        break;
      case 'P2020':
        status = HttpStatus.BAD_REQUEST;
        message = 'Value out of range.';
        break;
      case 'P2021':
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'The table does not exist.';
        break;
      case 'P2022':
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'The column does not exist.';
        break;
      case 'P2023':
        status = HttpStatus.BAD_REQUEST;
        message = 'Inconsistent column data.';
        break;
      case 'P2024':
        status = HttpStatus.REQUEST_TIMEOUT;
        message = 'Database connection timeout.';
        break;
      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found.';
        break;
      case 'P2026':
        status = HttpStatus.BAD_REQUEST;
        message = 'Unsupported database provider.';
        break;
      case 'P2027':
        status = HttpStatus.BAD_REQUEST;
        message = 'Multiple errors occurred.';
        break;
      case 'P2028':
        status = HttpStatus.BAD_REQUEST;
        message = 'Transaction API error.';
        break;
      case 'P2029':
        status = HttpStatus.BAD_REQUEST;
        message = 'Query parameter limit exceeded.';
        break;
      case 'P2030':
        status = HttpStatus.BAD_REQUEST;
        message = 'Cannot find a fulltext index.';
        break;
      case 'P2031':
        status = HttpStatus.BAD_REQUEST;
        message = 'MongoDB query error.';
        break;
      case 'P2032':
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid fulltext search index.';
        break;
      case 'P2033':
        status = HttpStatus.BAD_REQUEST;
        message = 'Number out of range.';
        break;
      case 'P2034':
        status = HttpStatus.BAD_REQUEST;
        message = 'Write conflict.';
        break;
      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Database error occurred';
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      error: exception.code,
      timestamp: new Date().toISOString(),
    });
  }
}
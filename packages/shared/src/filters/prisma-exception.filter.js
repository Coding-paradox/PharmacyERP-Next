"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PrismaExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaExceptionFilter = PrismaExceptionFilter_1 = class PrismaExceptionFilter {
    logger = new common_1.Logger(PrismaExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Database error occurred';
        this.logger.error(`Prisma error ${exception.code}: ${exception.message}`);
        switch (exception.code) {
            case 'P2000':
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'The provided value is too long for the field.';
                break;
            case 'P2001':
                status = common_1.HttpStatus.NOT_FOUND;
                message = 'The record searched for in the where condition does not exist.';
                break;
            case 'P2002':
                status = common_1.HttpStatus.CONFLICT;
                const target = exception.meta?.target?.join(', ') || 'field';
                message = `Unique constraint violation on ${target}.`;
                break;
            case 'P2003':
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'Foreign key constraint failed.';
                break;
            case 'P2004':
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'A constraint failed on the database.';
                break;
            case 'P2005':
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'Invalid value for the field type.';
                break;
            case 'P2006':
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'The provided value is invalid for the field.';
                break;
            case 'P2007':
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'Data validation error.';
                break;
            case 'P2008':
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'Failed to parse the query.';
                break;
            case 'P2009':
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'Failed to validate the query.';
                break;
            case 'P2010':
                status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
                message = 'Raw query failed.';
                break;
            case 'P2011':
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'Null constraint violation.';
                break;
            case 'P2012':
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'Missing required value.';
                break;
            case 'P2013':
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'Missing required argument.';
                break;
            case 'P2014':
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'Required relation violation.';
                break;
            case 'P2015':
                status = common_1.HttpStatus.NOT_FOUND;
                message = 'Related record not found.';
                break;
            case 'P2016':
                status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
                message = 'Query interpretation error.';
                break;
            case 'P2017':
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'The records for relation are not connected.';
                break;
            case 'P2018':
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'The required connected records were not found.';
                break;
            case 'P2019':
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'Input error.';
                break;
            case 'P2020':
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'Value out of range.';
                break;
            case 'P2021':
                status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
                message = 'The table does not exist.';
                break;
            case 'P2022':
                status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
                message = 'The column does not exist.';
                break;
            case 'P2023':
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'Inconsistent column data.';
                break;
            case 'P2024':
                status = common_1.HttpStatus.REQUEST_TIMEOUT;
                message = 'Database connection timeout.';
                break;
            case 'P2025':
                status = common_1.HttpStatus.NOT_FOUND;
                message = 'Record not found.';
                break;
            case 'P2026':
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'Unsupported database provider.';
                break;
            case 'P2027':
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'Multiple errors occurred.';
                break;
            case 'P2028':
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'Transaction API error.';
                break;
            case 'P2029':
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'Query parameter limit exceeded.';
                break;
            case 'P2030':
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'Cannot find a fulltext index.';
                break;
            case 'P2031':
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'MongoDB query error.';
                break;
            case 'P2032':
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'Invalid fulltext search index.';
                break;
            case 'P2033':
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'Number out of range.';
                break;
            case 'P2034':
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'Write conflict.';
                break;
            default:
                status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
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
};
exports.PrismaExceptionFilter = PrismaExceptionFilter;
exports.PrismaExceptionFilter = PrismaExceptionFilter = PrismaExceptionFilter_1 = __decorate([
    (0, common_1.Catch)(client_1.Prisma.PrismaClientKnownRequestError)
], PrismaExceptionFilter);
//# sourceMappingURL=prisma-exception.filter.js.map
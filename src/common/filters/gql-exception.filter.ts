import { Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { GqlArgumentsHost, GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { BusinessException } from '../exceptions/business.exception';

@Catch()
export class GraphQLExceptionsFilter implements GqlExceptionFilter {
  private readonly logger = new Logger(GraphQLExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost): GraphQLError {
    const gqlHost = GqlArgumentsHost.create(host);
    const context = gqlHost.getContext();
    const info = gqlHost.getInfo();

    // Log the error for debugging
    this.logger.error(
      `GraphQL Error in ${info?.fieldName}: ${exception.message}`,
      exception.stack,
      {
        fieldName: info?.fieldName,
        userId: context?.req?.user?.id,
        operation: info?.operation?.operation,
      }
    );

    // Handle Business Exceptions
    if (exception instanceof BusinessException) {
      return new GraphQLError(exception.message, {
        extensions: {
          code: exception.errorCode,
          statusCode: exception.statusCode,
          timestamp: new Date().toISOString(),
          path: info?.fieldName,
          context: exception.context,
        },
      });
    }

    // Handle Validation Errors (class-validator)
    if (exception.response && Array.isArray(exception.response.message)) {
      return new GraphQLError('Validation failed', {
        extensions: {
          code: 'VALIDATION_ERROR',
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp: new Date().toISOString(),
          path: info?.fieldName,
          validationErrors: exception.response.message,
        },
      });
    }

    // Handle TypeORM/Database Errors
    if (exception.code && (exception.code.startsWith('23') || exception.code.startsWith('42'))) {
      const dbError = this.handleDatabaseError(exception);
      return new GraphQLError(dbError.message, {
        extensions: {
          code: dbError.code,
          statusCode: dbError.statusCode,
          timestamp: new Date().toISOString(),
          path: info?.fieldName,
        },
      });
    }

    // Handle Unauthorized/Forbidden
    if (exception.status === HttpStatus.UNAUTHORIZED) {
      return new GraphQLError('Authentication required', {
        extensions: {
          code: 'UNAUTHENTICATED',
          statusCode: HttpStatus.UNAUTHORIZED,
          timestamp: new Date().toISOString(),
          path: info?.fieldName,
        },
      });
    }

    if (exception.status === HttpStatus.FORBIDDEN) {
      return new GraphQLError('Access denied', {
        extensions: {
          code: 'FORBIDDEN',
          statusCode: HttpStatus.FORBIDDEN,
          timestamp: new Date().toISOString(),
          path: info?.fieldName,
        },
      });
    }

    // Generic error fallback
    const isProduction = process.env.NODE_ENV === 'production';
    return new GraphQLError(
      isProduction ? 'Internal server error' : exception.message,
      {
        extensions: {
          code: 'INTERNAL_ERROR',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          timestamp: new Date().toISOString(),
          path: info?.fieldName,
          ...(isProduction ? {} : { originalError: exception.message }),
        },
      }
    );
  }

  private handleDatabaseError(exception: any) {
    // PostgreSQL error codes
    switch (exception.code) {
      case '23505': // unique_violation
        return {
          message: 'Resource already exists',
          code: 'DUPLICATE_RESOURCE',
          statusCode: HttpStatus.CONFLICT,
        };
      case '23503': // foreign_key_violation
        return {
          message: 'Referenced resource does not exist',
          code: 'INVALID_REFERENCE',
          statusCode: HttpStatus.BAD_REQUEST,
        };
      case '23514': // check_violation
        return {
          message: 'Data validation constraint failed',
          code: 'CONSTRAINT_VIOLATION',
          statusCode: HttpStatus.BAD_REQUEST,
        };
      default:
        return {
          message: 'Database operation failed',
          code: 'DATABASE_ERROR',
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        };
    }
  }
}
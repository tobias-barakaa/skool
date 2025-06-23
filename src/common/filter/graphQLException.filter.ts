// src/common/filters/graphql-exceptions.filter.ts
import {
  ArgumentsHost,
  Catch,
  Logger,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { BusinessException } from '../exceptions/business.exception';

@Catch()
export class GraphQLExceptionsFilter implements GqlExceptionFilter {
  private readonly logger = new Logger(GraphQLExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost): GraphQLError {
    const gqlContext = host.getArgByIndex(2);
    const operationName = gqlContext?.operation?.operationName || 'UnknownOperation';

    // Handle BusinessException
    if (exception instanceof BusinessException) {
      this.logger.warn(
        `[BusinessException] ${exception.name}: ${exception.message} | Metadata: ${JSON.stringify(
          exception.metadata,
        )}`,
      );

      return new GraphQLError(exception.message, {
        extensions: {
          code: exception.code,
          statusCode: exception.getStatus(),
          metadata: exception.metadata,
        },
      });
    }

    // Handle known HTTP exceptions
    if (
      exception instanceof ForbiddenException ||
      exception instanceof NotFoundException ||
      exception instanceof BadRequestException ||
      exception instanceof UnauthorizedException
    ) {
      this.logger.warn(`[${exception.name}] ${exception.message}`);

      return new GraphQLError(exception.message, {
        extensions: {
          code: exception.name.toUpperCase(),
          statusCode: exception.getStatus(),
        },
      });
    }

    // Fallback for unknown exceptions
    const errorMessage = exception.message || 'Unknown error';
    const errorStack = exception.stack || 'No stack trace available';

    this.logger.error(`[UnexpectedError] GraphQL Error in ${operationName}: ${errorMessage}`);
    this.logger.error(errorStack);

    return new GraphQLError('Internal server error', {
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
      },
    });
  }
}



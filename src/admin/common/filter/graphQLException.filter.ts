import {
  ArgumentsHost,
  Catch,
  Logger,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  HttpException,
} from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { BusinessException } from '../exceptions/business.exception';


@Catch()
export class GraphQLExceptionsFilter implements GqlExceptionFilter {
  private readonly logger = new Logger(GraphQLExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost): GraphQLError {
    const gqlContext = host.getArgByIndex(2);
    const operationName =
      gqlContext?.operation?.operationName || 'UnknownOperation';

    if (exception.name === 'ValidationError') {
      this.logger.warn(`[ValidationError] ${exception.message}`);
      return new GraphQLError('Input validation failed', {
        extensions: {
          code: 'VALIDATION_ERROR',
          details: exception.message,
          statusCode: 400,
        },
      });
    }

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

    if (exception?.code === 'ETIMEDOUT') {
      this.logger.error('[ETIMEDOUT] External connection timed out', exception);
      return new GraphQLError(
        'Service connection timed out. Please try again later.',
        {
          extensions: {
            code: 'EXTERNAL_TIMEOUT',
            statusCode: 504,
          },
        },
      );
    }

    if (exception instanceof HttpException) {
      this.logger.warn(`[${exception.name}] ${exception.message}`);
      return new GraphQLError(exception.message, {
        extensions: {
          code: exception.name.toUpperCase(),
          statusCode: exception.getStatus(),
        },
      });
    }

    const errorMessage = exception.message || 'Unknown error';
    const errorStack = exception.stack || 'No stack trace available';

    this.logger.error(
      `[UnexpectedError] GraphQL Error in ${operationName}: ${errorMessage}`,
    );
    this.logger.error(errorStack);

    return new GraphQLError('Internal server error', {
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500,
      },
    });
  }
}

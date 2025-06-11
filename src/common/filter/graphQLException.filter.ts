import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { GqlExceptionFilter, GqlArgumentsHost } from '@nestjs/graphql';
import { BusinessException } from '../exceptions/business.exception';
import { GraphQLError } from 'graphql';

@Catch()
export class GraphQLExceptionsFilter implements GqlExceptionFilter {
  private readonly logger = new Logger(GraphQLExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    const info = gqlHost.getInfo();
    
    this.logger.error(
      `GraphQL Error in ${info.fieldName}: ${exception.message}`,
      exception.stack
    );

    // Handle business exceptions
    if (exception instanceof BusinessException) {
      throw new GraphQLError(exception.message, {
        extensions: {
          code: exception.code,
          httpStatus: exception.getStatus(),
          type: exception.name,
          ...exception.metadata,
        },
      });
    }

    // Handle validation errors
    if (exception.message && exception.message.includes('Validation failed')) {
      try {
        const validationData = JSON.parse(
          exception.message.replace('Validation failed: ', '')
        );
        throw new GraphQLError('Validation error', {
          extensions: {
            code: 'VALIDATION_ERROR',
            httpStatus: 400,
            validationErrors: validationData,
          },
        });
      } catch (parseError) {
        // If parsing fails, treat as generic validation error
        throw new GraphQLError('Validation error', {
          extensions: {
            code: 'VALIDATION_ERROR',
            httpStatus: 400,
            message: exception.message,
          },
        });
      }
    }

    // Default error handling
    throw new GraphQLError(
      process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : exception.message,
      {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
          httpStatus: 500,
          ...(process.env.NODE_ENV !== 'production' && { 
            stack: exception.stack 
          }),
        },
      }
    );
  }
}
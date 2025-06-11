// src/filters/gql-exception.filter.ts
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { BusinessException } from '../exceptions/business.exception';

@Catch()
export class GqlAllExceptionsFilter extends BaseExceptionFilter implements GqlExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() === 'http') {
      return super.catch(exception, host);
    }

    // Handle GraphQL context
    const gqlError = this.formatGqlError(exception);
    throw gqlError;
  }

  private formatGqlError(exception: unknown): GraphQLError {
    if (exception instanceof GraphQLError) {
      return exception;
    }

    if (exception instanceof BusinessException) {
      return new GraphQLError(exception.message, {
        extensions: {
          code: exception.code,
          httpStatus: exception.getStatus(),
        },
      });
    }

    if (exception instanceof Error) {
      return new GraphQLError(exception.message, {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
          httpStatus: 500,
        },
      });
    }

    return new GraphQLError('Internal server error', {
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
        httpStatus: 500,
      },
    });
  }
}
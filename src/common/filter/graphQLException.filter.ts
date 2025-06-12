import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { BusinessException } from '../exceptions/business.exception';

@Catch()
export class GraphQLExceptionsFilter implements GqlExceptionFilter {
  private readonly logger = new Logger(GraphQLExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost): GraphQLError {
    const gqlContext = host.getArgByIndex(2); // GraphQL context (3rd argument in resolver)
    const operationName = gqlContext?.operation?.operationName || 'UnknownOperation';

    // Known business exception
    if (exception instanceof BusinessException) {
      this.logger.warn(
        `[BusinessException] ${exception.name}: ${exception.message} | Metadata: ${JSON.stringify(exception.metadata)}`
      );

      return new GraphQLError(exception.message, {
        extensions: {
          code: exception.code,
          statusCode: exception.getStatus(),
          metadata: exception.metadata,
        },
      });
    }

    // Unexpected or unknown exception
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

// import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
// import { GqlExceptionFilter, GqlArgumentsHost } from '@nestjs/graphql';
// import { BusinessException } from '../exceptions/business.exception';
// import { GraphQLError } from 'graphql';

// @Catch()
// export class GraphQLExceptionsFilter implements GqlExceptionFilter {
//   private readonly logger = new Logger(GraphQLExceptionsFilter.name);

//   catch(exception: any, host: ArgumentsHost) {
//     const gqlHost = GqlArgumentsHost.create(host);
//     const info = gqlHost.getInfo();
    
//     this.logger.error(
//       `GraphQL Error in ${info.fieldName}: ${exception.message}`,
//       exception.stack
//     );

//     // Handle business exceptions
//     if (exception instanceof BusinessException) {
//       throw new GraphQLError(exception.message, {
//         extensions: {
//           code: exception.code,
//           httpStatus: exception.getStatus(),
//           type: exception.name,
//           ...exception.metadata,
//         },
//       });
//     }

//     // Handle validation errors
//     if (exception.message && exception.message.includes('Validation failed')) {
//       try {
//         const validationData = JSON.parse(
//           exception.message.replace('Validation failed: ', '')
//         );
//         throw new GraphQLError('Validation error', {
//           extensions: {
//             code: 'VALIDATION_ERROR',
//             httpStatus: 400,
//             validationErrors: validationData,
//           },
//         });
//       } catch (parseError) {
//         // If parsing fails, treat as generic validation error
//         throw new GraphQLError('Validation error', {
//           extensions: {
//             code: 'VALIDATION_ERROR',
//             httpStatus: 400,
//             message: exception.message,
//           },
//         });
//       }
//     }

//     // Default error handling
//     throw new GraphQLError(
//       process.env.NODE_ENV === 'production' 
//         ? 'Internal server error' 
//         : exception.message,
//       {
//         extensions: {
//           code: 'INTERNAL_SERVER_ERROR',
//           httpStatus: 500,
//           ...(process.env.NODE_ENV !== 'production' && { 
//             stack: exception.stack 
//           }),
//         },
//       }
//     );
//   }
// }
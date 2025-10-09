// import { ArgumentsHost, Catch, HttpException, HttpStatus, ExecutionContext } from '@nestjs/common';
// import { GqlExceptionFilter, GqlExecutionContext } from '@nestjs/graphql';

// @Catch()
// export class GraphQLExceptionFilter implements GqlExceptionFilter {
//   catch(exception: unknown, host: ArgumentsHost) {
//     const gqlHost = GqlExecutionContext.create(host as unknown as ExecutionContext);
//     const ctx = gqlHost.getContext();

//     let status = HttpStatus.INTERNAL_SERVER_ERROR;
//     let message = 'Unexpected error occurred';
//     let code = 'INTERNAL_SERVER_ERROR';

//     if (exception instanceof HttpException) {
//       const response = exception.getResponse();
//       status = exception.getStatus();

//       if (typeof response === 'object' && response !== null) {
//         message = (response as any).message || message;
//       } else if (typeof response === 'string') {
//         message = response;
//       }

//       switch (status) {
//         case HttpStatus.BAD_REQUEST:
//           code = 'BAD_REQUEST';
//           break;
//         case HttpStatus.FORBIDDEN:
//           code = 'FORBIDDEN';
//           break;
//         case HttpStatus.NOT_FOUND:
//           code = 'NOT_FOUND';
//           break;
//       }
//     } else if (exception instanceof Error) {
//       message = exception.message;
//     }

//     return {
//       message,
//       extensions: {
//         code,
//         http: { status },
//       },
//     };
//   }
// }

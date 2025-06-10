import { Catch, ArgumentsHost } from '@nestjs/common';
import { GqlArgumentsHost, GqlExceptionFilter } from '@nestjs/graphql';
import { BusinessException } from '../exceptions/business.exception';

@Catch(BusinessException)
export class GraphQLBusinessExceptionFilter implements GqlExceptionFilter {
  catch(exception: BusinessException, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    
    return {
      message: exception.message,
      code: exception.getStatus(),
      timestamp: new Date().toISOString(),
    };
  }
}

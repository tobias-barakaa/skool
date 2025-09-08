import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { ActiveUserData } from '../interface/active-user.interface';
import { REQUEST_USER_KEY } from '../constants/auth.constants';

export const CurrentTenant = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
      let request;
      
      if (ctx.getType<GqlContextType>() === 'graphql') {
        const gqlContext = GqlExecutionContext.create(ctx);
        request = gqlContext.getContext().req;
      } else {
        request = ctx.switchToHttp().getRequest();
      }
      
      const user: ActiveUserData = request[REQUEST_USER_KEY];
      return user.tenantId;
    },
  );
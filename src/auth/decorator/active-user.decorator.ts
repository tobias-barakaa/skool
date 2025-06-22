import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { REQUEST_USER_KEY } from '../constants/auth.constants';
import { ActiveUserData } from '../interface/active-user.interface';

export const ActiveUser = createParamDecorator(
  (field: keyof ActiveUserData, ctx: ExecutionContext) => {
    let request;
    
    // Check if this is a GraphQL context
    if (ctx.getType<GqlContextType>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(ctx);
      request = gqlContext.getContext().req;
    } else {
      // For HTTP requests
      request = ctx.switchToHttp().getRequest();
    }
    
    const user: ActiveUserData = request[REQUEST_USER_KEY];
    
    if (!user) {
      console.error('User not found in request context. Available keys:', Object.keys(request));
      throw new Error('User not authenticated');
    }
    
    return field ? user?.[field] : user;
  }
);

// import {  createParamDecorator, ExecutionContext } from '@nestjs/common';
// import { REQUEST_USER_KEY } from '../constants/auth.constants';
// import { ActiveUserData } from '../interface/active-user.interface';

// export const ActiveUser = createParamDecorator(
//     (field: keyof ActiveUserData, ctx: ExecutionContext) => {
//         const request = ctx.switchToHttp().getRequest();
//         const user:ActiveUserData = request[REQUEST_USER_KEY]
//         return field ? user?.[field] : user;
//     }
// );


// import {  createParamDecorator, ExecutionContext } from '@nestjs/common';
// import { REQUEST_USER_KEY } from '../constants/auth.constants';
// import { ActiveUserData } from '../interface/active-user.interface';

// export const ActiveUser = createParamDecorator(
//     (field: keyof ActiveUserData, ctx: ExecutionContext) => {
//         const request = ctx.switchToHttp().getRequest();
//         const user:ActiveUserData = request[REQUEST_USER_KEY]
//         return field ? user?.[field] : user;
//     }
// );

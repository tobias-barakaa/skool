
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { REQUEST_USER_KEY } from '../constants/auth.constants';
import { ActiveUserData } from '../interface/active-user.interface';

/**
 * Extract authenticated user from request
 * @ActiveUser() - Get full user object
 * @ActiveUser('email') - Get specific field
 */
export const ActiveUser = createParamDecorator(
  (field: keyof ActiveUserData | undefined, ctx: ExecutionContext) => {
    let request: any;
    // Handle GraphQL and HTTP contexts
    if (ctx.getType<GqlContextType>() === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(ctx);
      request = gqlCtx.getContext().req;
    } else {
      request = ctx.switchToHttp().getRequest();
    }

    const user: ActiveUserData | undefined = request[REQUEST_USER_KEY];
    
    if (!user) {
      return null; // Let guards handle authentication
    }
    
    return field ? user[field] : user;
  }
);
//import { createParamDecorator, ExecutionContext } from '@nestjs/common';
// import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
// import { REQUEST_USER_KEY } from '../constants/auth.constants';
// import { ActiveUserData } from '../interface/active-user.interface';

// export const ActiveUser = createParamDecorator(
//   (field: keyof ActiveUserData, ctx: ExecutionContext) => {
//     let request: any;
    
//     // Check if this is a GraphQL context
//     if (ctx.getType<GqlContextType>() === 'graphql') {
//       const gqlContext = GqlExecutionContext.create(ctx);
//       request = gqlContext.getContext().req;
//     } else {
//       // For HTTP requests
//       request = ctx.switchToHttp().getRequest();
//     }
    
//     const user: ActiveUserData = request[REQUEST_USER_KEY];
    
//     if (!user) {
//       console.error('User not found in request context. Available keys:', Object.keys(request));
//       throw new Error('User not authenticated');
//     }
    
//     return field ? user?.[field] : user;
//   }
// );

// // import {  createParamDecorator, ExecutionContext } from '@nestjs/common';
// // import { REQUEST_USER_KEY } from '../constants/auth.constants';
// // import { ActiveUserData } from '../interface/active-user.interface';

// // export const ActiveUser = createParamDecorator(
// //     (field: keyof ActiveUserData, ctx: ExecutionContext) => {
// //         const request = ctx.switchToHttp().getRequest();
// //         const user:ActiveUserData = request[REQUEST_USER_KEY]
// //         return field ? user?.[field] : user;
// //     }
// // );


// // import {  createParamDecorator, ExecutionContext } from '@nestjs/common';
// // import { REQUEST_USER_KEY } from '../constants/auth.constants';
// // import { ActiveUserData } from '../interface/active-user.interface';

// // export const ActiveUser = createParamDecorator(
// //     (field: keyof ActiveUserData, ctx: ExecutionContext) => {
// //         const request = ctx.switchToHttp().getRequest();
// //         const user:ActiveUserData = request[REQUEST_USER_KEY]
// //         return field ? user?.[field] : user;
// //     }
// // );

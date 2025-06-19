import {  createParamDecorator, ExecutionContext } from '@nestjs/common';
import { REQUEST_USER_KEY } from '../constants/auth.constants';
import { ActiveUserData } from '../interface/active-user.interface';

export const ActiveUser = createParamDecorator(
    (field: keyof ActiveUserData, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user:ActiveUserData = request[REQUEST_USER_KEY]
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

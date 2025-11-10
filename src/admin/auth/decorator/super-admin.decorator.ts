// import { SetMetadata } from "@nestjs/common";
// import { AUTH_TYPE_KEY } from "../constants/auth.constants";
// import { AuthType } from "../enums/auth-type.enum";

// export const SuperAdminAuth = () =>
//     SetMetadata(AUTH_TYPE_KEY, [AuthType.SuperAdmin]);


import { SetMetadata } from '@nestjs/common';

export const SUPER_ADMIN_ONLY = 'superAdminOnly';
export const SuperAdminOnly = () => SetMetadata(SUPER_ADMIN_ONLY, true);

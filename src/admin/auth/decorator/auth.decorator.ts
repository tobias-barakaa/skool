// import { SetMetadata } from '@nestjs/common';
// import { AuthType } from '../enums/auth-type.enum';

// import { AUTH_TYPE_KEY } from '../constants/auth.constants';

// export const Auth = (...authTypes: AuthType[]) => SetMetadata(AUTH_TYPE_KEY, authTypes);


import { SetMetadata } from '@nestjs/common';
import { AuthType } from '../enums/auth-type.enum';
import { AUTH_TYPE_KEY } from '../constants/auth.constants';

/**
 * Defines authentication type for a route
 * @Auth(AuthType.None) - Public route, no authentication
 * @Auth(AuthType.Bearer) - Requires JWT token (default)
 */
export const Auth = (...authTypes: AuthType[]) => 
  SetMetadata(AUTH_TYPE_KEY, authTypes);

import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { AccessTokenGuard } from './access-token.guard';
  import { AuthType } from '../enums/auth-type.enum';
  import { AUTH_TYPE_KEY, PUBLIC_ROUTE_KEY } from '../constants/auth.constants';
  
  /**
   * Main authentication guard
   * Checks if route is public or requires authentication
   */
  @Injectable()
  export class AuthenticationGuard implements CanActivate {
    private static readonly defaultAuthType = AuthType.Bearer;
  
    constructor(
      private readonly reflector: Reflector,
      private readonly accessTokenGuard: AccessTokenGuard,
    ) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      // Check for public route marker
      const isPublic = this.reflector.getAllAndOverride<boolean>(
        PUBLIC_ROUTE_KEY,
        [context.getHandler(), context.getClass()],
      );
  
      if (isPublic) {
        return true;
      }
  
      // Get auth types for this route
      const authTypes = this.reflector.getAllAndOverride<AuthType[]>(
        AUTH_TYPE_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [AuthenticationGuard.defaultAuthType];
  
      // If AuthType.None is specified, allow access
      if (authTypes.includes(AuthType.None)) {
        return true;
      }
  
      // Otherwise, require Bearer token
      if (authTypes.includes(AuthType.Bearer)) {
        return this.accessTokenGuard.canActivate(context);
      }
  
      throw new UnauthorizedException();
    }
  }
  
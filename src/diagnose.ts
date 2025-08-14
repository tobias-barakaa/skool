import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AUTH_TYPE_KEY } from './admin/auth/constants/auth.constants';

@Injectable()
export class AuthDiagnosticGuard implements CanActivate {
  private readonly logger = new Logger(AuthDiagnosticGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const authTypes =
      this.reflector.get(AUTH_TYPE_KEY, context.getHandler()) ||
      this.reflector.get(AUTH_TYPE_KEY, context.getClass());

    const isPublic =
      this.reflector.get<boolean>('isPublic', context.getHandler()) ??
      this.reflector.get<boolean>('isPublic', context.getClass());

    const contextInfo = this.getContextInfo(context);

    // Log every request for debugging
    this.logger.debug('🔍 Auth Diagnostic:', {
      authTypes,
      isPublic,
      contextInfo,
    });

    // Flag problematic endpoints
    if (!authTypes && !isPublic) {
      this.logger.warn('⚠️  MISSING @Auth() decorator on:', contextInfo);
      this.logger.warn(
        '   This endpoint needs either @Auth(AuthType.BEARER) or @Public()',
      );
    }

    if (authTypes && authTypes.includes(1)) {
      this.logger.warn('⚠️  PROBLEMATIC AUTH TYPE [1] on:', contextInfo);
      this.logger.warn('   Consider changing to @Auth(AuthType.BEARER) // [0]');
    }

    return true; // Always allow - this is just for diagnostics
  }

  private getContextInfo(context: ExecutionContext): any {
    if (context.getType<'http' | 'graphql'>() === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      const info = gqlCtx.getInfo();
      return {
        type: 'GraphQL',
        resolver: info.parentType?.name,
        field: info.fieldName,
      };
    } else {
      const request = context.switchToHttp().getRequest();
      return {
        type: 'HTTP',
        method: request.method,
        url: request.url,
      };
    }
  }
}

// Add this to your app.module.ts temporarily:
/*
providers: [
  AppService,
  {
    provide: APP_GUARD,
    useClass: AuthDiagnosticGuard, // Add this FIRST to catch everything
  },
  {
    provide: APP_GUARD,
    useClass: AuthenticationGuard,
  },
  {
    provide: APP_GUARD,
    useClass: TenantRoleGuard
  },
  // ... rest of providers
],
*/

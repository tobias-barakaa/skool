import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUEST_USER_KEY, SKIP_TENANT_KEY, PUBLIC_ROUTE_KEY } from '../constants/auth.constants';
import { TenantValidationProvider } from '../providers/tenant-validation.provider';
import { GlobalRole } from 'src/admin/users/entities/user.entity';
import { ActiveUserData } from '../interface/active-user.interface';

/**
 * Validates user has access to the tenant
 * Super Admins bypass tenant checks
 * Can be skipped with @SkipTenant()
 */
@Injectable()
export class TenantAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantValidationService: TenantValidationProvider,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      PUBLIC_ROUTE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    // Check if tenant validation should be skipped
    const skipTenant = this.reflector.getAllAndOverride<boolean>(
      SKIP_TENANT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipTenant) {
      return true;
    }

    const request = this.extractRequest(context);
    const user = request[REQUEST_USER_KEY] as ActiveUserData | undefined;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Super Admins bypass tenant validation
    if (user.globalRole === GlobalRole.SUPER_ADMIN) {
      return true;
    }

    // Regular users must have tenant context in JWT
    if (!user.tenantId) {
      throw new UnauthorizedException('No tenant context. Please sign in through your school subdomain.');
    }

    // Get tenant ID from cookie (browser) OR from JWT token (server-to-server/GraphQL Playground)
    const tenantIdFromCookie = request.cookies?.tenant_id;
    
    // If no cookie (like in GraphQL Playground), trust the JWT token's tenantId
    // Cookies are only used in browser-based authentication for additional security
    const tenantIdToValidate = tenantIdFromCookie || user.tenantId;

    // If cookie exists, it must match the JWT token (prevents cookie manipulation in browsers)
    if (tenantIdFromCookie && user.tenantId !== tenantIdFromCookie) {
      throw new ForbiddenException('Tenant mismatch between token and cookie');
    }

    // Validate user belongs to tenant
    const validation = await this.tenantValidationService.validateUserTenantAccess(
      user.sub,
      tenantIdToValidate,
    );

    // Attach tenant and membership to request for later use
    request.tenant = validation.tenant;
    request.membership = validation.membership;

    return true;
  }

  private extractRequest(context: ExecutionContext): any {
    if (context.getType<any>() === 'graphql') {
      const GqlExecutionContext = require('@nestjs/graphql').GqlExecutionContext;
      return GqlExecutionContext.create(context).getContext().req;
    }
    return context.switchToHttp().getRequest();
  }
}
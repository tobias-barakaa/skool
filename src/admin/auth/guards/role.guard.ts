import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUEST_USER_KEY, ROLES_KEY, PUBLIC_ROUTE_KEY } from '../constants/auth.constants';
import { MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { GlobalRole } from 'src/admin/users/entities/user.entity';
import { ActiveUserData } from '../interface/active-user.interface';

/**
 * Validates user has required role
 * Super Admins bypass all role checks
 */
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      PUBLIC_ROUTE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<MembershipRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No roles required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = this.extractRequest(context);
    const user = request[REQUEST_USER_KEY] as ActiveUserData | undefined;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Super Admins have access to everything
    if (user.globalRole === GlobalRole.SUPER_ADMIN) {
      return true;
    }

    // Check tenant role
    if (!user.role) {
      throw new ForbiddenException('User does not have a role in this tenant');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`
      );
    }

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

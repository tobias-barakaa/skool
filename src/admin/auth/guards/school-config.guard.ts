import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUEST_USER_KEY, SKIP_SCHOOL_CONFIG_KEY, PUBLIC_ROUTE_KEY } from '../constants/auth.constants';
import { SchoolSetupGuardService } from 'src/admin/config/school-config.guard';
import { GlobalRole } from 'src/admin/users/entities/user.entity';
import { MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { ActiveUserData } from '../interface/active-user.interface';

/**
 * Validates school is configured
 * Super Admins bypass this check
 * SCHOOL_ADMINs bypass this check (they need access to configure the school)
 * Can be skipped with @SkipSchoolConfig()
 */
@Injectable()
export class SchoolConfigGuard implements CanActivate {
  constructor(
    private readonly schoolSetupGuardService: SchoolSetupGuardService,
    private readonly reflector: Reflector,
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

    // Check if school config check should be skipped
    const skipSchoolConfig = this.reflector.getAllAndOverride<boolean>(
      SKIP_SCHOOL_CONFIG_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipSchoolConfig) {
      return true;
    }

    const request = this.extractRequest(context);
    const user = request[REQUEST_USER_KEY] as ActiveUserData | undefined;

    // No user authenticated, skip check (let auth guard handle)
    if (!user) {
      return true;
    }

    // Super Admins bypass school configuration checks
    if (user.globalRole === GlobalRole.SUPER_ADMIN) {
      return true;
    }

    // SCHOOL_ADMINs bypass school configuration checks
    // They need access to configure the school in the first place!
    if (user.role === MembershipRole.SCHOOL_ADMIN) {
      return true;
    }

    // Regular users need tenant ID
    if (!user.tenantId) {
      throw new ForbiddenException(
        'Tenant information missing. Please access through your school subdomain.'
      );
    }

    // Validate school is configured for non-admin users
    try {
      await this.schoolSetupGuardService.validateSchoolIsConfigured(
        user.tenantId
      );
      return true;
    } catch (error) {
      throw new ForbiddenException(
        'School setup incomplete. Please ask your school administrator to complete the configuration.'
      );
    }
  }

  private extractRequest(context: ExecutionContext): any {
    if (context.getType<any>() === 'graphql') {
      const GqlExecutionContext = require('@nestjs/graphql').GqlExecutionContext;
      return GqlExecutionContext.create(context).getContext().req;
    }
    return context.switchToHttp().getRequest();
  }
}
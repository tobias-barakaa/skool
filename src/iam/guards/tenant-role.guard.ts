import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import {
  MembershipRole,
  MembershipStatus,
  UserTenantMembership,
} from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';

@Injectable()
export class TenantRoleGuard implements CanActivate {
  private readonly logger = new Logger(TenantRoleGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserTenantMembership)
    private readonly membershipRepo: Repository<UserTenantMembership>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Check if route is public
      const isPublic =
        this.reflector.get<boolean>('isPublic', context.getHandler()) ??
        this.reflector.get<boolean>('isPublic', context.getClass());

      if (isPublic) {
        this.logger.debug('Route is public, allowing access');
        return true;
      }

      // Get required roles and debug info
      const requiredRoles =
        this.reflector.get<MembershipRole[]>('roles', context.getHandler()) ??
        this.reflector.get<MembershipRole[]>('roles', context.getClass()) ??
        [];

      const debugLabel =
        this.reflector.get<string>('debugAccess', context.getHandler()) ??
        this.reflector.get<string>('debugAccess', context.getClass());

      if (debugLabel) {
        this.logger.debug(`Processing access for: ${debugLabel}`);
      }

      // Extract user from request
      const { user, request } = this.extractUserAndRequest(context);

      if (!user) {
        this.logger.warn('No authenticated user found');
        return false;
      }

      this.logger.debug(
        `Checking access for user: ${user.sub}, tenant: ${user.tenantId}`,
      );

      // Verify user exists
      const userRow = await this.userRepo.findOne({
        where: { id: user.sub },
      });

      if (!userRow) {
        this.logger.warn(`User not found in database: ${user.sub}`);
        return false;
      }

      // Check tenant membership
      const membership = await this.membershipRepo.findOne({
        where: {
          userId: user.sub,
          tenantId: user.tenantId,
          status: MembershipStatus.ACTIVE,
        },
      });

      if (!membership) {
        this.logger.warn(
          `No active membership found for user ${user.sub} in tenant ${user.tenantId}`,
        );
        return false;
      }

      // Check role requirements
      if (
        requiredRoles.length > 0 &&
        !requiredRoles.includes(membership.role)
      ) {
        this.logger.warn(
          `User ${user.sub} has role ${membership.role}, but requires one of: ${requiredRoles.join(', ')}`,
        );
        return false;
      }

      // Attach membership to request for downstream use
      request.membership = membership;

      this.logger.debug(
        `Access granted for user ${user.sub} with role ${membership.role}`,
      );

      return true;
    } catch (error) {
      this.logger.error('Error in TenantRoleGuard:', {
        error: error.message,
        stack: error.stack,
        context: this.getContextInfo(context),
      });

      // Re-throw the error to let NestJS handle it properly
      throw error;
    }
  }

  private extractUserAndRequest(context: ExecutionContext): {
    user: ActiveUserData | null;
    request: any;
  } {
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      return { user: request.user, request };
    } else {
      const gqlCtx = GqlExecutionContext.create(context);
      const request = gqlCtx.getContext().req;
      return { user: request.user, request };
    }
  }

  private getContextInfo(context: ExecutionContext): any {
    if (context.getType<'graphql'>() === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      const info = gqlCtx.getInfo();
      return {
        type: 'GraphQL',
        parentType: info.parentType?.name,
        fieldName: info.fieldName,
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

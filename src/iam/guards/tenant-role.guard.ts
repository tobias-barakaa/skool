// src/auth/guards/tenant-role.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MembershipRole,
  MembershipStatus,
  UserTenantMembership,
} from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class TenantRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(UserTenantMembership)
    private readonly membershipRepo: Repository<UserTenantMembership>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<MembershipRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; 
    }

    const gqlContext = GqlExecutionContext.create(context);
    const user: ActiveUserData = gqlContext.getContext().req.user;

    if (!user || !user.sub || !user.tenantId) {
      return false; 
    }

    const membership = await this.membershipRepo.findOne({
      where: {
        userId: user.sub,
        tenantId: user.tenantId,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (!membership) {
      return false;
    }

    const hasRequiredRole = requiredRoles.some(
      (role) => membership.role === role,
    );
    if (!hasRequiredRole) {
      return false;
    }

    gqlContext.getContext().req.membership = membership;

    return true;
  }
}

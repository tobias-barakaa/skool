import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { MembershipRole, MembershipStatus, UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';

@Injectable()
export class TenantRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserTenantMembership)
    private readonly membershipRepo: Repository<UserTenantMembership>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic =
      this.reflector.get<boolean>('isPublic', context.getHandler()) ??
      this.reflector.get<boolean>('isPublic', context.getClass());
    if (isPublic) return true;
    const roles =
      this.reflector.get<MembershipRole[]>('roles', context.getHandler()) ?? [];
    const requiredRole = roles[0];



    let user: ActiveUserData;
    if (context.getType() === 'http') {
      user = context.switchToHttp().getRequest().user;
    } else {
      user = GqlExecutionContext.create(context).getContext().req.user;
    }
    if (!user) return false;

    const userRow = await this.userRepo.findOne({ where: { id: user.sub } });
    if (!userRow) return false;

    const membership = await this.membershipRepo.findOne({
      where: {
        userId: user.sub,
        tenantId: user.tenantId,
        status: MembershipStatus.ACTIVE,
      },
    });
    if (!membership) return false;

   if (roles.length && !roles.includes(membership.role)) {
     return false;
   }

    (
      context.switchToHttp().getRequest() ??
      GqlExecutionContext.create(context).getContext().req
    ).membership = membership;

    return true;
  }
}

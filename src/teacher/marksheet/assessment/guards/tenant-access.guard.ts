import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { MembershipStatus, UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TenantAccessGuard implements CanActivate {
  constructor(
    @InjectRepository(UserTenantMembership)
    private userTenantRepo: Repository<UserTenantMembership>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    const user = req.user;

    if (!user || !user.id || !user.tenantId) {
      throw new ForbiddenException(
        'User not authenticated or tenant not found',
      );
    }

    // Verify user has active membership in the tenant
    const membership = await this.userTenantRepo.findOne({
      where: {
        userId: user.sub,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException('User does not have access to this tenant');
    }

    return true;
  }
}

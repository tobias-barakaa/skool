// src/admin/invitations/providers/generic-inviter.provider.ts

import {
  ForbiddenException,
  Injectable
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  UserInvitation,
  InvitationType,
  InvitationStatus,
} from '../entities/user-iInvitation.entity';
import {
  UserTenantMembership,
  MembershipRole,
  MembershipStatus,
} from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';

@Injectable()
export class GenericPendingProvider {
  constructor(
    @InjectRepository(UserInvitation)
    private invitationRepository: Repository<UserInvitation>,

    @InjectRepository(UserTenantMembership)
    private membershipRepository: Repository<UserTenantMembership>,

  ) {}

  async getPendingInvitationsByType(
    tenantId: string,
    currentUser: ActiveUserData,
    type: InvitationType,
    allowedRoles: MembershipRole[] = [MembershipRole.SCHOOL_ADMIN],
  ) {
    const membership = await this.membershipRepository.findOne({
      where: {
        user: { id: currentUser.sub },
        tenant: { id: tenantId },
        role: In(allowedRoles),
        status: MembershipStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You do not have access to view these invitations',
      );
    }

    return this.invitationRepository.find({
      where: {
        tenant: { id: tenantId },
        type,
        status: InvitationStatus.PENDING,
      },
      relations: ['invitedBy'],
      order: { createdAt: 'DESC' },
    });
  }

}

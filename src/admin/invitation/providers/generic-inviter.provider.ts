// src/invitation/providers/generic-inviter.provider.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { User } from 'src/admin/users/entities/user.entity';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import {
  MembershipRole,
  UserTenantMembership,
} from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import {
  InvitationStatus,
  InvitationType,
  UserInvitation,
} from '../entities/user-iInvitation.entity';
import { validateMembershipAccess } from 'src/admin/shared/utils/access.utils';
import { checkIfUserAlreadyInTenant } from 'src/admin/shared/utils/check-existing-membership.util';
import { handleInvitationThrottleAndExpiry } from 'src/admin/shared/utils/invitation.utils';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';

@Injectable()
export class GenericInviterProvider {
  constructor(
    @InjectRepository(UserInvitation)
    private invitationRepository: Repository<UserInvitation>,

    @InjectRepository(UserTenantMembership)
    private membershipRepository: Repository<UserTenantMembership>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

  async inviteUser<T extends { email: string; fullName: string; role: string }>(
    inviter: ActiveUserData,
    tenantId: string,
    dto: T,
    type: InvitationType,
    sendEmailFn: (
      email: string,
      fullName: string,
      schoolName: string,
      token: string,
      invitedBy: string,
      tenantId: string,
    ) => Promise<void>,
    createProfileFn: () => Promise<void>,
  ) {
    await validateMembershipAccess(
      this.membershipRepository,
      inviter.sub,
      tenantId,
      [MembershipRole.SCHOOL_ADMIN],
    );

    await checkIfUserAlreadyInTenant(
      dto.email,
      tenantId,
      this.userRepository,
      this.membershipRepository,
    );

    await handleInvitationThrottleAndExpiry(
      dto.email,
      tenantId,
      this.invitationRepository,
    );

    const tenant = await this.tenantRepository.findOneOrFail({
      where: { id: tenantId },
    });

    const { token, expiresAt } = this.createInvitationToken();

    const invitation = this.invitationRepository.create({
      email: dto.email,
      role: dto.role,
      userData: dto,
      token,
      type,
      status: InvitationStatus.PENDING,
      expiresAt,
      invitedBy: inviter,
      tenant: { id: tenantId },
    });


    await this.invitationRepository.save(invitation);

    await createProfileFn();

    await sendEmailFn(
      dto.email,
      dto.fullName,
      tenant.name,
      token,
      inviter.sub,
      tenantId,
    );

    return {
      email: invitation.email,
      fullName: dto.fullName,
      status: invitation.status,
      createdAt: invitation.createdAt,
    };
  }

  private createInvitationToken(): { token: string; expiresAt: Date } {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return { token, expiresAt };
  }
}

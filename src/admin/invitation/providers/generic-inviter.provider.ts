// src/invitation/providers/generic-inviter.provider.ts

import {  ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
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
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { handleInvitationResendLogic } from 'src/admin/shared/utils/invitation.utils';

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
    // Basic validation
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

    const tenant = await this.tenantRepository.findOneOrFail({
      where: { id: tenantId },
    });

    const existingInvitation = await handleInvitationResendLogic(
      dto.email,
      tenantId,
      this.invitationRepository,
    );

    const { token, expiresAt } = this.createInvitationToken();
    let invitationToSave: UserInvitation;
    const isResend = !!existingInvitation;

    if (isResend) {
      // 3A. RESEND LOGIC: Update the existing invitation
      console.log(`Resending invitation to ${dto.email}`);

      existingInvitation.token = token;
      existingInvitation.expiresAt = expiresAt;
      existingInvitation.status = InvitationStatus.PENDING; // Ensure status is reset
      existingInvitation.userData = dto; // Update data in case it changed
      existingInvitation.updatedAt = new Date();
      // Note: We don't change invitedBy or createdAt

      invitationToSave = existingInvitation;
    } else {
      // 3B. NEW INVITATION LOGIC: Create a completely new invitation
      console.log(`Sending a new invitation to ${dto.email}`);

      invitationToSave = this.invitationRepository.create({
        email: dto.email,
        name: dto.fullName,
        role: dto.role,
        userData: dto,
        token,
        type,
        status: InvitationStatus.PENDING,
        expiresAt,
        invitedBy: { id: inviter.sub } as User, 
        tenant: { id: tenantId },
      });

      // IMPORTANT: The profile is only created ONCE, for the first invitation.
      await createProfileFn();
    }

    // 4. Save the new or updated invitation to the database
    const savedInvitation =
      await this.invitationRepository.save(invitationToSave);

    // 5. Send the email with the new token
    await sendEmailFn(
      dto.email,
      dto.fullName,
      tenant.name,
      token,
      inviter.sub,
      tenantId,
    );

    // 6. Return the result
    return {
      email: savedInvitation.email,
      fullName: dto.fullName,
      status: savedInvitation.status,
      createdAt: savedInvitation.createdAt, // This will be the original creation date on a resend
      isResend,
    };
  }

  private createInvitationToken(): { token: string; expiresAt: Date } {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return { token, expiresAt };
  }
}

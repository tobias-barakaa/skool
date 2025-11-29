import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ObjectLiteral } from 'typeorm';
import * as crypto from 'crypto';
import {
  UserInvitation,
  InvitationStatus,
  InvitationType,
} from '../entities/user-iInvitation.entity';
import { MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { GenericInviterProvider } from './generic-inviter.provider';
import { AcceptInvitationProvider } from './accept-invitation.provider';
import { GenericPendingProvider } from './generic-pending.provider';
import { AcceptInvitationResponse } from 'src/admin/teacher/dtos/accept-teacher-invitation-response.dto';
import { User } from 'src/admin/users/entities/user.entity';
import { GenericDeleteProvider } from './generic-delete.provider';

@Injectable()
export class InvitationService {
  constructor(
    @InjectRepository(UserInvitation)
    private invitationRepository: Repository<UserInvitation>,
    private readonly genericInviterProvider: GenericInviterProvider,
    private readonly genericPendingProvider: GenericPendingProvider,
    private readonly acceptInvitationProvider: AcceptInvitationProvider,
    private readonly genericDeleteProvider: GenericDeleteProvider,
    private readonly invitationService: GenericDeleteProvider,
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
    return this.genericInviterProvider.inviteUser(
      inviter,
      tenantId,
      dto,
      type,
      sendEmailFn,
      createProfileFn,
    );
  }

  async getPendingInvitationsByType(
    tenantId: string,
    currentUser: ActiveUserData,
    type: InvitationType,
    allowedRoles: MembershipRole[] = [MembershipRole.SCHOOL_ADMIN],
  ) {
    return this.genericPendingProvider.getPendingInvitationsByType(
      tenantId,
      currentUser,
      type,
      allowedRoles,
    );
  }

  async acceptInvitation(
    token: string,
    password: string,
    postAcceptCallback?: (
      user: User,
      invitation: UserInvitation,
    ) => Promise<void>,
  ) {
    return this.acceptInvitationProvider.acceptInvitation(
      token,
      password,
      postAcceptCallback as
        | ((user: User, invitation: UserInvitation) => Promise<void>)
        | undefined,
    );
  }

  async markInvitationAsAccepted(invitationId: string) {
    await this.invitationRepository.update(
      { id: invitationId },
      { status: InvitationStatus.ACCEPTED },
    );
  }

  async markInvitationAsRejected(invitationId: string) {
    await this.invitationRepository.update(
      { id: invitationId },
      { status: InvitationStatus.DECLINED },
    );
  }

  async getInvitationByToken(token: string) {
    return this.invitationRepository.findOne({
      where: { token },
      relations: ['tenant', 'invitedBy'],
    });
  }

  async revokeInvitation(invitationId: string, currentUser: User) {
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
      relations: ['tenant'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    return this.genericDeleteProvider.deleteEntity(
      this.invitationRepository,
      invitationId,
      currentUser.id,
      invitation.tenant.id,
      {
        roles: [MembershipRole.SCHOOL_ADMIN],
        entityRelations: ['tenant'],
      },
    );
  }

  async cancelInvitation(
    invitationId: string,
    currentUser: ActiveUserData,
    tenantId: string,
  ) {
    await this.invitationRepository.update(
      { id: invitationId },
      { status: InvitationStatus.CANCELLED },
    );
  }

  async resendInvitation(
    invitationId: string,
    currentUser: ActiveUserData,
    tenantId: string,
    sendEmailFn: (
      email: string,
      fullName: string,
      schoolName: string,
      token: string,
      invitedBy: string,
      tenantId: string,
    ) => Promise<void>,
  ) {
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
      relations: ['tenant', 'invitedBy'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const { token, expiresAt } = this.createInvitationToken();

    await this.invitationRepository.update(
      { id: invitationId },
      { token, expiresAt, status: InvitationStatus.PENDING },
    );

    const userData = invitation.userData as any;
    await sendEmailFn(
      invitation.email,
      userData.fullName,
      invitation.tenant.name,
      token,
      invitation.tenantId,
      tenantId,
    );

    return { message: 'Invitation resent successfully' };
  }

  private createInvitationToken(): { token: string; expiresAt: Date } {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return { token, expiresAt };
  }

  async deleteEntity<T extends ObjectLiteral>(
    repository: Repository<T>,
    entityId: string,
    currentUserId: string,
    tenantId: string,
    options: {
      roles?: MembershipRole[];
      entityRelations?: string[];
      userIdField?: string;
      deleteUserIfOrphaned?: boolean;
    },
  ) {
    return this.genericDeleteProvider.deleteEntity(
      repository,
      entityId,
      currentUserId,
      tenantId,
      options,
    );
  }






}

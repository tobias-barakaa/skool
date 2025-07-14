// src/admin/invitation/providers/accept-invitation.provider.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import {
  UserInvitation,
  InvitationStatus,
} from '../entities/user-iInvitation.entity';
import {
  UserTenantMembership,
  MembershipRole,
  MembershipStatus,
} from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { GenerateTokenProvider } from 'src/admin/auth/providers/generate-token.provider';
import { HashingProvider } from 'src/admin/auth/providers/hashing.provider';

export interface AcceptInvitationResult {
  message: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  invitation: UserInvitation;
  membership: UserTenantMembership;
  role: MembershipRole; 
}

@Injectable()
export class AcceptInvitationProvider {
  constructor(
    @InjectRepository(UserInvitation)
    private invitationRepository: Repository<UserInvitation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserTenantMembership)
    private membershipRepository: Repository<UserTenantMembership>,
    private readonly generateTokensProvider: GenerateTokenProvider,
    private readonly hashPassword: HashingProvider,
  ) {}

  async acceptInvitation(
    token: string,
    password: string,
    postAcceptCallback?: (
      user: User,
      invitation: UserInvitation,
    ) => Promise<void>,
  ): Promise<AcceptInvitationResult> {

    const invitation = await this.invitationRepository.findOne({
      where: {
        token,
        status: InvitationStatus.PENDING,
      },
      relations: ['tenant', 'invitedBy'],
    });

    if (!invitation) {
      throw new NotFoundException('Invalid or expired invitation');
    }

    if (invitation.expiresAt < new Date()) {
      await this.invitationRepository.update(invitation.id, {
        status: InvitationStatus.EXPIRED,
      });
      throw new BadRequestException('Invitation has expired');
    }

    let user = await this.userRepository.findOne({
      where: { email: invitation.email },
    });

    if (!user) {
      user = await this.createUserFromInvitation(invitation, password);
    }

    const membership = await this.createMembership(user, invitation);
    if (postAcceptCallback) {
      await postAcceptCallback(user, invitation);
    }

    await this.invitationRepository.update(invitation.id, {
      status: InvitationStatus.ACCEPTED,
    });

    const tokens = await this.generateTokensProvider.generateTokens(
      user,
      membership,
      invitation.tenant,
    );

    return {
      message: 'Invitation accepted successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      invitation,
      membership,
      role: membership.role,
    };
  }

  private async createUserFromInvitation(
    invitation: UserInvitation,
    password: string,
  ): Promise<User> {
    const hashedPassword = await this.hashPassword.hashPassword(password);
    const userData = invitation.userData as any;

    const user = this.userRepository.create({
      email: invitation.email,
      password: hashedPassword,
      name: userData.fullName,
      schoolUrl: invitation.tenant.subdomain,
    });

    return await this.userRepository.save(user);
  }

  private async createMembership(
    user: User,
    invitation: UserInvitation,
  ): Promise<UserTenantMembership> {
    const membership = this.membershipRepository.create({
      user,
      tenant: invitation.tenant,
      role: invitation.role as MembershipRole,
      status: MembershipStatus.ACTIVE,
    });

    return await this.membershipRepository.save(membership);
  }


}

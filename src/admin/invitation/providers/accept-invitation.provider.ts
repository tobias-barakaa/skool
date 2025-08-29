// src/admin/invitation/providers/accept-invitation.provider.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import {
  UserInvitation,
  InvitationStatus,
  InvitationType,
} from '../entities/user-iInvitation.entity';
import {
  UserTenantMembership,
  MembershipRole,
  MembershipStatus,
} from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { GenerateTokenProvider } from 'src/admin/auth/providers/generate-token.provider';
import { HashingProvider } from 'src/admin/auth/providers/hashing.provider';
import { Teacher } from 'src/admin/teacher/entities/teacher.entity';

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
  private readonly logger = new Logger(AcceptInvitationProvider.name);

  constructor(
    @InjectRepository(UserInvitation)
    private invitationRepository: Repository<UserInvitation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserTenantMembership)
    private membershipRepository: Repository<UserTenantMembership>,
    private readonly generateTokensProvider: GenerateTokenProvider,
    private readonly hashPassword: HashingProvider,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
  ) {}

  async acceptInvitation(
    token: string,
    password: string,
    customTeacherLinkFn?: (
      user: User,
      invitation: UserInvitation,
    ) => Promise<void>,
  ): Promise<AcceptInvitationResult> {
    // Find and validate invitation
    const invitation = await this.findAndValidateInvitation(token);

    // Get or create user
    let user = await this.userRepository.findOne({
      where: { email: invitation.email },
    });

    if (!user) {
      user = await this.createUserFromInvitation(invitation, password);
    }

    // Create membership
    const membership = await this.createMembership(user, invitation);

    // Handle teacher-specific logic
    if (invitation.type === InvitationType.TEACHER) {
      if (customTeacherLinkFn) {
        await customTeacherLinkFn(user, invitation);
      } else {
        await this.linkTeacherToUser(user.id, invitation);
      }
    }

    // Mark invitation as accepted
    await this.invitationRepository.update(invitation.id, {
      status: InvitationStatus.ACCEPTED,
    });

    // Generate tokens
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

  private async findAndValidateInvitation(
    token: string,
  ): Promise<UserInvitation> {
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

    return invitation;
  }

  // This method is in AcceptInvitationProvider

  private async linkTeacherToUser(
    userId: string,
    invitation: UserInvitation,
  ): Promise<void> {
    try {
      const teacher = await this.teacherRepository.findOne({
        where: {
          email: invitation.email,
          tenantId: invitation.tenantId,
        },
      });

      if (!teacher) {
        this.logger.error(
          `Teacher profile not found for email: ${invitation.email}, tenant: ${invitation.tenantId}`,
        );
        throw new BadRequestException('Teacher profile not found');
      }

      teacher.user = { id: userId } as User;

      teacher.isActive = true;
      teacher.hasCompletedProfile = true;


      this.logger.log(`Linking teacher ${teacher.id} to user ${userId}`);

      await this.teacherRepository.save(teacher);

      this.logger.log(
        `Successfully linked teacher profile ${teacher.id} to user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to link teacher to user ${userId}:`,
        error.message,
      );
      throw error;
    }
  }

  private async createUserFromInvitation(
    invitation: UserInvitation,
    password: string,
  ): Promise<User> {
    try {
      const userData = invitation.userData as any;

      // Validate required data
      if (!userData?.fullName) {
        throw new BadRequestException(
          'Invitation data is incomplete - missing name',
        );
      }

      const hashedPassword = await this.hashPassword.hashPassword(password);

      const user = this.userRepository.create({
        email: invitation.email,
        password: hashedPassword,
        name: userData.fullName,
        schoolUrl: invitation.tenant.subdomain,
      });

      const savedUser = await this.userRepository.save(user);

      this.logger.log(
        `Created user from invitation: ${savedUser.id} (${savedUser.email})`,
      );

      return savedUser;
    } catch (error) {
      this.logger.error(
        `Failed to create user from invitation:`,
        error.message,
      );
      throw error;
    }
  }

  private async createMembership(
    user: User,
    invitation: UserInvitation,
  ): Promise<UserTenantMembership> {
    try {
      const membership = this.membershipRepository.create({
        user,
        tenant: invitation.tenant,
        role: invitation.role as MembershipRole,
        status: MembershipStatus.ACTIVE,
        joinedAt: new Date(),
      });

      const savedMembership = await this.membershipRepository.save(membership);

      this.logger.log(
        `Created membership for user ${user.id} in tenant ${invitation.tenant.id} with role ${invitation.role}`,
      );

      return savedMembership;
    } catch (error) {
      this.logger.error(`Failed to create membership:`, error.message);
      throw error;
    }
  }
}

import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { Teacher } from '../entities/teacher.entity';
import { User } from 'src/users/entities/user.entity';
import { InvitationStatus, InvitationType, UserInvitation } from 'src/invitation/entities/user-iInvitation.entity';
import { MembershipRole, MembershipStatus, UserTenantMembership } from 'src/user-tenant-membership/entities/user-tenant-membership.entity';
import { Tenant } from 'src/tenants/entities/tenant.entity';
import { EmailService } from 'src/email/providers/email.service';
import { CreateTeacherInvitationDto } from '../dtos/create-teacher-invitation.dto';
import { EmailSendFailedException } from 'src/common/exceptions/business.exception';
import { GenerateTokenProvider } from 'src/auth/providers/generate-token.provider';

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserInvitation)
    private readonly invitationRepository: Repository<UserInvitation>,
    @InjectRepository(UserTenantMembership)
    private readonly membershipRepository: Repository<UserTenantMembership>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly emailService: EmailService,
    private readonly generateTokensProvider: GenerateTokenProvider,


  ) {}

  async inviteTeacher(
    createTeacherDto: CreateTeacherInvitationDto,
    currentUser: User,
    tenantId: string
  ) {
    // Verify that current user is SUPER_ADMIN for this tenant
    const membership = await this.membershipRepository.findOne({
      where: {
        user: { id: currentUser.id },
        tenant: { id: tenantId },
        role: MembershipRole.SCHOOL_ADMIN,
        status: MembershipStatus.ACTIVE
      }
    });

    if (!membership) {
      throw new ForbiddenException('Only SUPER_ADMIN can invite teachers');
    }

    // Check if user with this email already exists in this tenant
    const existingUser = await this.userRepository.findOne({
      where: { email: createTeacherDto.email }
    });

    if (existingUser) {
      const existingMembership = await this.membershipRepository.findOne({
        where: {
          user: { id: existingUser.id },
          tenant: { id: tenantId }
        }
      });

      if (existingMembership) {
        throw new BadRequestException('User already exists in this tenant');
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await this.invitationRepository.findOne({
      where: {
        email: createTeacherDto.email,
        tenant: { id: tenantId },
        status: InvitationStatus.ACCEPTED
      }
    });

    if (existingInvitation) {
      throw new BadRequestException('Invitation already sent to this email');
    }

    // Get tenant info
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId }
    });

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); 

    // Create invitation record
    const invitation = this.invitationRepository.create({
      email: createTeacherDto.email,
      role: createTeacherDto.role,
      userData: createTeacherDto,
      token,
      type: InvitationType.TEACHER,
      status: InvitationStatus.PENDING,
      expiresAt,
      invitedBy: currentUser,
      tenant: { id: tenantId }
    });

    await this.invitationRepository.save(invitation);

    // Create teacher record with pre-filled data (not yet linked to user)
    const teacher = this.teacherRepository.create({
      ...createTeacherDto,
      isActive: false,
      hasCompletedProfile: false,
    });

    await this.teacherRepository.save(teacher);

    // Send invitation email
    try {
      await this.emailService.sendTeacherInvitation(
        createTeacherDto.email,
        createTeacherDto.fullName,
        tenant?.name || 'Unknown Tenant',
        token,
        currentUser.name,
        tenantId
      );
    } catch (error) {
      console.error('[EmailService Error]', error);
      throw new EmailSendFailedException(createTeacherDto.email);
    }

    return {
      email: invitation.email,
      fullName: teacher.fullName,
      status: invitation.status,
      createdAt: invitation.createdAt,
    };

  }

  async acceptInvitation(token: string, password: string) {
    // Find invitation
    const invitation = await this.invitationRepository.findOne({
      where: { 
        token, 
        status: InvitationStatus.PENDING 
      },
      relations: ['tenant', 'invitedBy']
    });

    if (!invitation) {
      throw new NotFoundException('Invalid or expired invitation');
    }

    if (invitation.expiresAt < new Date()) {
      await this.invitationRepository.update(invitation.id, {
        status: InvitationStatus.EXPIRED
      });
      throw new BadRequestException('Invitation has expired');
    }

    // Check if user already exists
    let user = await this.userRepository.findOne({
      where: { email: invitation.email }
    });

    if (!user) {
      // Create new user
      const hashedPassword = await bcrypt.hash(password, 10);
      const teacherData = invitation.userData as CreateTeacherInvitationDto;
      
      user = this.userRepository.create({
        email: invitation.email,
        password: hashedPassword,
        name: teacherData.fullName,
        schoolUrl: invitation.tenant.subdomain
      });

      await this.userRepository.save(user);
    }

    // Create tenant membership
    const membership = this.membershipRepository.create({
      user,
      tenant: invitation.tenant,
      role: MembershipRole.TEACHER,
      status: MembershipStatus.ACTIVE
    });

    await this.membershipRepository.save(membership);

    // Find and link the teacher profile
    const teacher = await this.teacherRepository.findOne({
      where: { email: invitation.email }
    });

    if (teacher) {
      teacher.userId = user.id;
      teacher.isActive = true;
      await this.teacherRepository.save(teacher);
    }

    // Update invitation status
    await this.invitationRepository.update(invitation.id, {
      status: InvitationStatus.ACCEPTED
    });

  const tokens = await this.generateTokensProvider.generateTokens(user, membership, invitation.tenant);
  const { accessToken, refreshToken } = tokens;

  return {
    message: 'Invitation accepted successfully',
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    },
    tokens: {
      accessToken,
      refreshToken,
    },
    teacher: teacher ? {
      id: teacher.id,
      name: teacher.fullName,
    } : null
  };
  }

  async getPendingInvitations(tenantId: string, currentUser: User) {
    // Verify admin access
    const membership = await this.membershipRepository.findOne({
      where: {
        user: { id: currentUser.id },
        tenant: { id: tenantId },
        role: MembershipRole.SUPER_ADMIN,
        status: MembershipStatus.ACTIVE
      }
    });

    if (!membership) {
      throw new ForbiddenException('Access denied');
    }

    return this.invitationRepository.find({
      where: {
        tenant: { id: tenantId },
        status: InvitationStatus.PENDING
      },
      relations: ['invitedBy'],
      order: { createdAt: 'DESC' }
    });
  }

  async revokeInvitation(invitationId: string, currentUser: User) {
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
      relations: ['tenant']
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Verify admin access
    const membership = await this.membershipRepository.findOne({
      where: {
        user: { id: currentUser.id },
        tenant: { id: invitation.tenant.id },
        role: MembershipRole.SUPER_ADMIN,
        status: MembershipStatus.ACTIVE
      }
    });

    if (!membership) {
      throw new ForbiddenException('Access denied');
    }

    await this.invitationRepository.update(invitationId, {
      status: InvitationStatus.REVOKED
    });

    return { message: 'Invitation revoked successfully' };
  }
}
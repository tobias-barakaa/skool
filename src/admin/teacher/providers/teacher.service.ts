import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { GenerateTokenProvider } from 'src/admin/auth/providers/generate-token.provider';
import { EmailService } from 'src/admin/email/providers/email.service';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { Equal, LessThan, MoreThan, Not, Repository } from 'typeorm';
import { CreateTeacherInvitationDto } from '../dtos/create-teacher-invitation.dto';
import { TeacherDto } from '../dtos/teacher-query.dto';
import { Teacher } from '../entities/teacher.entity';
import { User } from 'src/admin/users/entities/user.entity';
import { InvitationStatus, InvitationType, UserInvitation } from 'src/admin/invitation/entities/user-iInvitation.entity';
import { MembershipRole, MembershipStatus, UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { EmailSendFailedException } from 'src/admin/common/exceptions/business.exception';

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
    tenantId: string,
  ) {
    // Verify that current user is SCHOOL_ADMIN for this tenant
    const membership = await this.membershipRepository.findOne({
      where: {
        user: { id: currentUser.id },
        tenant: { id: tenantId },
        role: MembershipRole.SCHOOL_ADMIN,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Only SCHOOL_ADMIN can invite teachers');
    }

    // Check if user with this email already exists in this tenant
    const existingUser = await this.userRepository.findOne({
      where: { email: createTeacherDto.email },
    });

    if (existingUser) {
      const existingMembership = await this.membershipRepository.findOne({
        where: {
          user: { id: existingUser.id },
          tenant: { id: tenantId },
        },
      });

      if (existingMembership) {
        throw new BadRequestException('User already exists in this tenant');
      }
    }

    // Check for recent pending invitation (within last 10 minutes)
    const tenMinutesAgo = new Date();
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

    const recentInvitation = await this.invitationRepository.findOne({
      where: {
        email: createTeacherDto.email,
        tenant: { id: tenantId },
        status: InvitationStatus.PENDING,
        createdAt: MoreThan(tenMinutesAgo),
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (recentInvitation) {
      throw new BadRequestException(
        'An invitation was already sent to this email recently. Please wait 10 minutes before sending another.',
      );
    }

    // Expire old pending invitations for this email and tenant
    await this.invitationRepository.update(
      {
        email: createTeacherDto.email,
        tenant: { id: tenantId },
        status: InvitationStatus.PENDING,
        expiresAt: LessThan(new Date()),
      },
      {
        status: InvitationStatus.EXPIRED,
      },
    );

    // Get tenant info
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
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
      tenant: { id: tenantId },
    });

    await this.invitationRepository.save(invitation);

    // Check if teacher record already exists for this email
    let teacher = await this.teacherRepository.findOne({
      where: { email: createTeacherDto.email },
    });

    if (!teacher) {
      teacher = this.teacherRepository.create({
        ...createTeacherDto,
        isActive: false,
        hasCompletedProfile: false,
        tenant: { id: tenantId },
      });

      await this.teacherRepository.save(teacher);
    }

    // Send invitation email
    try {
      await this.emailService.sendTeacherInvitation(
        createTeacherDto.email,
        createTeacherDto.fullName,
        tenant?.name || 'Unknown Tenant',
        token,
        currentUser.name,
        tenantId,
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
      const hashedPassword = await bcrypt.hash(password, 10);
      const teacherData = invitation.userData as CreateTeacherInvitationDto;

      user = this.userRepository.create({
        email: invitation.email,
        password: hashedPassword,
        name: teacherData.fullName,
        schoolUrl: invitation.tenant.subdomain,
      });

      await this.userRepository.save(user);
    }

    // Create tenant membership
    const membership = this.membershipRepository.create({
      user,
      tenant: invitation.tenant,
      role: MembershipRole.TEACHER,
      status: MembershipStatus.ACTIVE,
    });

    await this.membershipRepository.save(membership);

    // Find and link the teacher profile
    const teacher = await this.teacherRepository.findOne({
      where: { email: invitation.email },
    });

    if (teacher) {
      teacher.userId = user.id;
      teacher.isActive = true;
      await this.teacherRepository.save(teacher);
    }

    // Update invitation status
    await this.invitationRepository.update(invitation.id, {
      status: InvitationStatus.ACCEPTED,
    });

    const tokens = await this.generateTokensProvider.generateTokens(
      user,
      membership,
      invitation.tenant,
    );
    const { accessToken, refreshToken } = tokens;

    return {
      message: 'Invitation accepted successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
      teacher: teacher
        ? {
            id: teacher.id,
            name: teacher.fullName,
          }
        : null,
    };
  }

  async deleteTeacher(id: string, currentUser: User, tenantId: string) {
    // Step 1: Verify admin access
    const membership = await this.membershipRepository.findOne({
  where: {
    user: { id: currentUser.id },
    tenant: { id: tenantId },
    role: MembershipRole.SCHOOL_ADMIN,
    status: MembershipStatus.ACTIVE,
  },
});

if (!membership) {
  throw new ForbiddenException('Only SCHOOL_ADMIN can delete teachers');
}

// Step 2: Find the teacher
const teacher = await this.teacherRepository.findOne({
  where: { id, tenant: { id: tenantId } },
  relations: ['tenant'],
});

if (!teacher) {
  throw new NotFoundException('Teacher not found');
}

// Step 3: Delete teacher record first (to release FK lock)
await this.teacherRepository.delete({ id });

// Step 4: Delete teacher's membership for this tenant
if (teacher.userId) {
  await this.membershipRepository.delete({
    user: { id: teacher.userId },
    tenant: { id: tenantId },
  });

  // Step 5: Check if user belongs to any other tenants
  const otherMemberships = await this.membershipRepository.find({
    where: {
      user: { id: teacher.userId },
      tenant: Not(Equal(tenantId)),
    },
  });

  // Step 6: Delete user only if no other memberships exist
  if (otherMemberships.length === 0) {
    await this.userRepository.delete({ id: teacher.userId });
  }
}

return {
  message: 'Teacher, membership, and user (if orphaned) deleted successfully',
}

  }


  async getTeachersByTenant(tenantId: string): Promise<TeacherDto[]> {
    const teachers = await this.teacherRepository.find({
      where: {
        tenantId,
        isActive: true,
      },
    });

    return teachers.map((teacher) => ({
      id: teacher.id,
      fullName: teacher.fullName,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phoneNumber: teacher.phoneNumber,
      gender: teacher.gender,
      department: teacher.department,
      address: teacher.address,
      subject: teacher.subject,
      employeeId: teacher.employeeId,
      dateOfBirth: teacher.dateOfBirth
        ? new Date(teacher.dateOfBirth)
        : undefined,
      isActive: teacher.isActive,
      hasCompletedProfile: teacher.hasCompletedProfile,
      userId: teacher.userId,
    }));
  }

  async getPendingInvitations(tenantId: string, currentUser: User) {
    // Verify admin access
    const membership = await this.membershipRepository.findOne({
      where: {
        user: { id: currentUser.id },
        tenant: { id: tenantId },
        role: MembershipRole.SCHOOL_ADMIN,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Access denied');
    }

    return this.invitationRepository.find({
      where: {
        tenant: { id: tenantId },
        status: InvitationStatus.PENDING,
      },
      relations: ['invitedBy'],
      order: { createdAt: 'DESC' },
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

    // Verify admin access
    const membership = await this.membershipRepository.findOne({
      where: {
        user: { id: currentUser.id },
        tenant: { id: invitation.tenant.id },
        role: MembershipRole.SCHOOL_ADMIN,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Access denied');
    }

    await this.invitationRepository.update(invitationId, {
      status: InvitationStatus.REVOKED,
    });

    return { message: 'Invitation revoked successfully' };
  }
}

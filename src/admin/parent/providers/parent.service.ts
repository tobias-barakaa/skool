// providers/parent.service.ts
import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { User } from 'src/admin/users/entities/user.entity';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { MembershipRole, MembershipStatus, UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { Student } from 'src/admin/student/entities/student.entity';
import { Parent } from '../entities/parent.entity';
import { ParentStudent } from '../entities/parent-student.entity';
import { InvitationStatus, InvitationType, UserInvitation } from 'src/admin/invitation/entities/user-iInvitation.entity';
import { EmailService } from 'src/admin/email/providers/email.service';
import { GenerateTokenProvider } from 'src/admin/auth/providers/generate-token.provider';
import { StudentSearchResponse } from '../dtos/student-search-response.dto';
import { InviteParentResponse } from '../dtos/invite-parent-response.dto';
import { CreateParentInvitationDto } from '../dtos/accept-parent-invitation.dto';

@Injectable()
export class ParentService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(UserTenantMembership)
    private membershipRepository: Repository<UserTenantMembership>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Parent)
    private parentRepository: Repository<Parent>,
    @InjectRepository(ParentStudent)
    private parentStudentRepository: Repository<ParentStudent>,
    @InjectRepository(UserInvitation)
    private invitationRepository: Repository<UserInvitation>,
    private emailService: EmailService,
    private generateTokensProvider: GenerateTokenProvider,
  ) {}








  async searchStudentsByName(
    name: string,
    tenantId: string,
  ): Promise<StudentSearchResponse[]> {
    // First, find all student memberships for this tenant
    const studentMemberships = await this.membershipRepository.find({
      where: {
        tenant: { id: tenantId },
        role: MembershipRole.STUDENT,
        status: MembershipStatus.ACTIVE,
      },
      relations: ['user'],
    });

    // Filter by name and get student details
    const matchingStudents: StudentSearchResponse[] = [];

    for (const membership of studentMemberships) {
      if (membership.user.name.toLowerCase().includes(name.toLowerCase())) {
        const student = await this.studentRepository.findOne({
          where: { user_id: membership.user.id },
        });

        if (student) {
          matchingStudents.push({
            id: student.id,
            name: membership.user.name,
            admissionNumber: student.admission_number,
            grade: student.grade,
            phone: student.phone,
          });
        }
      }
    }

    return matchingStudents;
  }

  async searchStudentByAdmission(
    admissionNumber: string,
    tenantId: string,
  ): Promise<StudentSearchResponse | null> {
    const student = await this.studentRepository.findOne({
      where: { admission_number: admissionNumber },
      relations: ['user'],
    });

    if (!student) {
      return null;
    }

    // Verify student belongs to this tenant
    const membership = await this.membershipRepository.findOne({
      where: {
        user: { id: student.user_id },
        tenant: { id: tenantId },
        role: MembershipRole.STUDENT,
        status: MembershipStatus.ACTIVE,
      },
      relations: ['user'],
    });

    if (!membership) {
      return null;
    }

    return {
      id: student.id,
      name: membership.user.name,
      admissionNumber: student.admission_number,
      grade: student.grade,
      phone: student.phone,
    };
  }

  async searchStudentByManualInput(
    studentFullName?: string,
    studentGrade?: string,
    studentPhone?: string,
    tenantId?: string,
  ): Promise<StudentSearchResponse[]> {
    // Start with all student memberships for this tenant
    const studentMemberships = await this.membershipRepository.find({
      where: {
        tenant: { id: tenantId },
        role: MembershipRole.STUDENT,
        status: MembershipStatus.ACTIVE,
      },
      relations: ['user'],
    });

    console.log('Searching students by manual input:', {
      studentFullName,
      studentGrade,
      studentPhone,
      tenantId});

    const matchingStudents: StudentSearchResponse[] = [];

    for (const membership of studentMemberships) {
      const student = await this.studentRepository.findOne({
        where: { user_id: membership.user.id },
      });

      if (!student) continue;

      let matches = true;

      // Check name match
      if (
        studentFullName &&
        !membership.user.name
          .toLowerCase()
          .includes(studentFullName.toLowerCase())
      ) {
        matches = false;
      }

      // Check grade match
      if (studentGrade && student.grade !== studentGrade) {
        matches = false;
      }

      // Check phone match
      if (studentPhone && student.phone !== studentPhone) {
        matches = false;
      }

      if (matches) {
        matchingStudents.push({
          id: student.id,
          name: membership.user.name,
          admissionNumber: student.admission_number,
          grade: student.grade,
          phone: student.phone,
        });
      }
    }

    return matchingStudents;
  }

  async inviteParent(
    createParentDto: CreateParentInvitationDto,
    currentUser: User,
    tenantId: string,
    studentId: string, // This will be provided by frontend after student selection
  ): Promise<InviteParentResponse> {
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
      throw new ForbiddenException('Only SCHOOL_ADMIN can invite parents');
    }

    // Verify student exists and belongs to this tenant
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const studentMembership = await this.membershipRepository.findOne({
      where: {
        user: { id: student.user_id },
        tenant: { id: tenantId },
        role: MembershipRole.STUDENT,
        status: MembershipStatus.ACTIVE,
      },
      relations: ['user'],
    });

    if (!studentMembership) {
      throw new ForbiddenException('Student does not belong to this tenant');
    }

    // Check if user with this email already exists in this tenant
    const existingUser = await this.userRepository.findOne({
      where: { email: createParentDto.email },
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
        email: createParentDto.email,
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
        email: createParentDto.email,
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

    // Create invitation record with student information
    const invitation = this.invitationRepository.create({
      email: createParentDto.email,
      role: MembershipRole.PARENT,
      userData: {
        ...createParentDto,
        studentId: studentId,
        studentName: studentMembership.user.name,
        studentAdmissionNumber: student.admission_number,
      },
      token,
      type: InvitationType.PARENT,
      status: InvitationStatus.PENDING,
      expiresAt,
      invitedBy: currentUser,
      tenant: { id: tenantId },
    });

    await this.invitationRepository.save(invitation);

    // Check if parent record already exists for this email
    let parent = await this.parentRepository.findOne({
      where: { email: createParentDto.email },
    });

    if (!parent) {
      parent = this.parentRepository.create({
        email: createParentDto.email,
        name: createParentDto.name,
        phone: createParentDto.phone,
        isActive: false,
        tenantId: tenantId,
      });

      await this.parentRepository.save(parent);
    }

    // Create parent-student relationship
    const parentStudent = this.parentStudentRepository.create({
      parent: { id: parent.id },
      student: { id: studentId },
    });

    await this.parentStudentRepository.save(parentStudent);

    // Send invitation email
    try {
      await this.emailService.sendParentInvitation(
        createParentDto.email,
        createParentDto.name,
        tenant?.name || 'Unknown Tenant',
        token,
        currentUser.name,
        tenantId,
        studentMembership.user.name,
      );
    } catch (error) {
      console.error('[EmailService Error]', error);
      throw new BadRequestException('Failed to send invitation email');
    }

    return {
      email: invitation.email,
      name: parent.name,
      status: invitation.status,
      createdAt: invitation.createdAt,
      studentName: studentMembership.user.name,
      studentAdmissionNumber: student.admission_number,
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
      const parentData = invitation.userData as any;

      user = this.userRepository.create({
        email: invitation.email,
        password: hashedPassword,
        name: parentData.fullName,
        schoolUrl: invitation.tenant.subdomain,
      });

      await this.userRepository.save(user);
    }

    // Create tenant membership
    const membership = this.membershipRepository.create({
      user,
      tenant: invitation.tenant,
      role: MembershipRole.PARENT,
      status: MembershipStatus.ACTIVE,
    });

    await this.membershipRepository.save(membership);

    // Find and link the parent profile
    const parent = await this.parentRepository.findOne({
      where: { email: invitation.email },
    });

    if (parent) {
      parent.userId = user.id;
      parent.isActive = true;
      await this.parentRepository.save(parent);
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
      parent: parent
        ? await this.parentRepository.findOne({ where: { id: parent.id } })
        : null,
    };
  }
}

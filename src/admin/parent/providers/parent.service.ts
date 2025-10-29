// providers/parent.service.ts
import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import * as crypto from 'crypto';
import { User } from 'src/admin/users/entities/user.entity';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import {
  MembershipRole,
  MembershipStatus,
  UserTenantMembership,
} from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { Student } from 'src/admin/student/entities/student.entity';
import { Parent } from '../entities/parent.entity';
import { ParentStudent } from '../entities/parent-student.entity';
import {
  InvitationStatus,
  InvitationType,
  UserInvitation,
} from 'src/admin/invitation/entities/user-iInvitation.entity';
import { EmailService } from 'src/admin/email/providers/email.service';
import { StudentSearchResponse } from '../dtos/student-search-response.dto';
import { InviteParentResponse } from '../dtos/invite-parent-response.dto';
import { CreateParentInvitationDto } from '../dtos/accept-parent-invitation.dto';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { AcceptParentInvitationResponse } from '../dtos/accept-parent-invitation.response.dto';
import { InvitationService } from 'src/admin/invitation/providers/invitation.service';
import { SchoolSetupGuardService } from 'src/admin/config/school-config.guard';
import { ParentDto } from '../dtos/parent.dto';

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
    private readonly invitationService: InvitationService,

    private readonly schoolSetupGuardService: SchoolSetupGuardService,

  ) {}

  async searchStudentsByName(
    name: string,
    tenantId: string,
  ): Promise<StudentSearchResponse[]> {
    const studentMemberships = await this.membershipRepository.find({
      where: {
        tenant: { id: tenantId },
        role: MembershipRole.STUDENT,
        status: MembershipStatus.ACTIVE,
      },
      relations: ['user'],
    });

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
            grade: String(student.grade),
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
      grade: String(student.grade),
      phone: student.phone,
    };
  }

  async searchStudentByManualInput(
    studentFullName?: string,
    studentGrade?: string,
    studentPhone?: string,
    tenantId?: string,
  ): Promise<StudentSearchResponse[]> {
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
      tenantId,
    });

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

      if (studentGrade && String(student.grade) !== studentGrade) {
        matches = false;
      }

      if (studentPhone && student.phone !== studentPhone) {
        matches = false;
      }

      if (matches) {
        matchingStudents.push({
          id: student.id,
          name: membership.user.name,
          admissionNumber: student.admission_number,
          grade: String(student.grade),
          phone: student.phone,
        });
      }
    }

    return matchingStudents;
  }


  async inviteParent(
  createParentDto: CreateParentInvitationDto,
  currentUser: ActiveUserData,
  studentIds: string[],
): Promise<InviteParentResponse> {

  
  const membership = await this.membershipRepository.findOne({
    where: {
      user: { id: currentUser.sub },
      tenant: { id: currentUser.tenantId },
      role: MembershipRole.SCHOOL_ADMIN,
      status: MembershipStatus.ACTIVE,
    },
  });

  if (!membership) {
    throw new ForbiddenException('Only SCHOOL_ADMIN can invite parents');
  }

  await this.schoolSetupGuardService.validateSchoolIsConfigured(
    membership.tenantId,
  );


  const validatedStudents: {
    student: Student;
    membership: UserTenantMembership;
  }[] = [];

  for (const studentId of studentIds) {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    const studentMembership = await this.membershipRepository.findOne({
      where: {
        user: { id: student.user_id },
        tenant: { id: currentUser.tenantId },
        role: MembershipRole.STUDENT,
        status: MembershipStatus.ACTIVE,
      },
      relations: ['user'],
    });

    if (!studentMembership) {
      throw new ForbiddenException(
        `Student ${studentId} does not belong to this tenant`,
      );
    }

    validatedStudents.push({
      student,
      membership: studentMembership,
    });
  }

  const existingUser = await this.userRepository.findOne({
    where: { email: createParentDto.email },
  });

  if (existingUser) {
    const existingMembership = await this.membershipRepository.findOne({
      where: {
        user: { id: existingUser.id },
        tenant: { id: currentUser.tenantId },
      },
    });

    if (existingMembership) {
      throw new BadRequestException('User already exists in this tenant');
    }
  }

  const tenMinutesAgo = new Date();
  tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

  const recentInvitation = await this.invitationRepository.findOne({
    where: {
      email: createParentDto.email,
      tenant: { id: currentUser.tenantId },
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

  await this.invitationRepository.update(
    {
      email: createParentDto.email,
      tenant: { id: currentUser.tenantId },
      status: InvitationStatus.PENDING,
      expiresAt: LessThan(new Date()),
    },
    {
      status: InvitationStatus.EXPIRED,
    },
  );

  const tenant = await this.tenantRepository.findOne({
    where: { id: currentUser.tenantId },
  });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const studentsData = validatedStudents.map(({ student, membership }) => ({
    id: student.id,
    name: membership.user.name,
    admissionNumber: student.admission_number,
    grade: String(student.grade),
  }));

  const invitation = this.invitationRepository.create({
    email: createParentDto.email,
    name: createParentDto.name,
    role: MembershipRole.PARENT,
    userData: {
      ...createParentDto,
      fullName: createParentDto.name,
      students: studentsData,
    },
    token,
    type: InvitationType.PARENT,
    status: InvitationStatus.PENDING,
    expiresAt,
    invitedBy: currentUser,
    tenant: { id: currentUser.tenantId },
  });

  await this.invitationRepository.save(invitation);

  let parent = await this.parentRepository.findOne({
    where: { email: createParentDto.email },
  });

  if (!parent) {
    parent = this.parentRepository.create({
      email: createParentDto.email,
      name: createParentDto.name,
      phone: createParentDto.phone,
      isActive: false,
      tenantId: currentUser.tenantId,
    });

    await this.parentRepository.save(parent);
  }

  const parentStudentRelations: ParentStudent[] = [];
  for (const studentId of studentIds) {
    const existingRelation = await this.parentStudentRepository.findOne({
      where: {
        parent: { id: parent.id },
        student: { id: studentId },
      },
    });

    if (!existingRelation) {
      const parentStudent = this.parentStudentRepository.create({
        parent: { id: parent.id },
        student: { id: studentId },
        tenantId: currentUser.tenantId,
      });
      parentStudentRelations.push(parentStudent);
    }
  }

  if (parentStudentRelations.length > 0) {
    await this.parentStudentRepository.save(parentStudentRelations);
  }

  try {
    await this.emailService.sendParentInvitation(
      createParentDto.email,
      createParentDto.name,
      currentUser.subdomain,
      token,
      currentUser.tenantId,
      studentsData,
    );
  } catch (error) {
    console.error('[EmailService Error]', error);
    throw new BadRequestException('cannot send invitation in development mode');
  }

  return {
    email: invitation.email,
    name: parent.name,
    status: invitation.status,
    createdAt: invitation.createdAt,
    students: studentsData,
    studentAdmissionNumber: studentsData
      .map((student) => student.admissionNumber)
      .join(', '),
  };
}

  async addStudentsToParent(
    parentId: string,
    studentIds: string[],
    tenantId: string,
    currentUser: User,
  ): Promise<{ message: string; addedStudents: any[] }> {
    const membership = await this.membershipRepository.findOne({
      where: {
        user: { id: currentUser.id },
        tenant: { id: tenantId },
        role: MembershipRole.SCHOOL_ADMIN,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'Only SCHOOL_ADMIN can manage parent-student relationships',
      );
    }

    const parent = await this.parentRepository.findOne({
      where: { id: parentId, tenantId: tenantId },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    const addedStudents: {
      id: string;
      name: string;
      admissionNumber: string;
      grade: string;
    }[] = [];
    for (const studentId of studentIds) {
      const student = await this.studentRepository.findOne({
        where: { id: studentId },
      });

      if (!student) {
        throw new NotFoundException(`Student with ID ${studentId} not found`);
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
        throw new ForbiddenException(
          `Student ${studentId} does not belong to this tenant`,
        );
      }

      const existingRelation = await this.parentStudentRepository.findOne({
        where: {
          parent: { id: parentId },
          student: { id: studentId },
        },
      });

      if (!existingRelation) {
        const parentStudent = this.parentStudentRepository.create({
          parent: { id: parentId },
          student: { id: studentId },
        });

        await this.parentStudentRepository.save(parentStudent);

        addedStudents.push({
          id: student.id,
          name: studentMembership.user.name,
          admissionNumber: student.admission_number,
          grade: String(student.grade),
        });
      }
    }

    return {
      message: `${addedStudents.length} students added to parent`,
      addedStudents,
    };
  }





  async getAllParents(tenantId: string): Promise<ParentDto[]> {
    const parents = await this.parentRepository.find({
      where: { tenantId },
      relations: ['parentStudents', 'parentStudents.student', 'parentStudents.student.user'],
      order: { createdAt: 'DESC' },
    });

    return parents.map((parent) => ({
      id: parent.id,
      name: parent.name,
      email: parent.email,
      phone: parent.phone,
      address: parent.address ?? undefined,
      occupation: parent.occupation ?? undefined,
      isActive: parent.isActive,
      userId: parent.userId ?? undefined,
      createdAt: parent.createdAt,
      updatedAt: parent.updatedAt,
      students: parent.parentStudents.map((studentRelationship) => ({
        id: studentRelationship.student.id,
        admissionNumber: studentRelationship.student.admission_number,
        firstName: studentRelationship.student.user.name,
        lastName: studentRelationship.student.user.schoolUrl,
        grade: String(studentRelationship.student.grade),
        relationship: studentRelationship.relationship,
        isPrimary: studentRelationship.isPrimary,
      })),
    }));
  }

  async getStudentsForParent(
    parentId: string,
    tenantId: string,
  ): Promise<StudentSearchResponse[]> {
    const parentStudentRelations = await this.parentStudentRepository.find({
      where: {
        parent: { id: parentId },
      },
      relations: ['student'],
    });

    const students: StudentSearchResponse[] = [];
    for (const relation of parentStudentRelations) {
      const student = relation.student;
      const studentMembership = await this.membershipRepository.findOne({
        where: {
          user: { id: student.user_id },
          tenant: { id: tenantId },
          role: MembershipRole.STUDENT,
          status: MembershipStatus.ACTIVE,
        },
        relations: ['user'],
      });

      if (studentMembership) {
        students.push({
          id: student.id,
          name: studentMembership.user.name,
          admissionNumber: student.admission_number,
          grade: String(student.grade),
          phone: student.phone,
        });
      }
    }

    return students;
  }

  async getParentsByTenant(tenantId: string): Promise<Parent[]> {
    return this.parentRepository.find({
      where: {
        tenantId,
        isActive: true,
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getParentPendingInvitations(
    tenantId: string,
    currentUser: ActiveUserData,
  ) {
    const membership = await this.membershipRepository.findOne({
      where: {
        user: { id: currentUser.sub },
        tenant: { id: tenantId },
        role: MembershipRole.SCHOOL_ADMIN,
        status: MembershipStatus.ACTIVE,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Access denied: Not a school admin');
    }

    return this.invitationRepository.find({
      where: {
        tenantId,
        role: MembershipRole.PARENT,
        status: InvitationStatus.PENDING,
      },
      relations: ['invitedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async revokeParentInvitation(
    invitationId: string,
    currentUser: ActiveUserData,
  ) {
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
      relations: ['tenant'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const membership = await this.membershipRepository.findOne({
      where: {
        user: { id: currentUser.sub },
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

    return { message: 'Parent invitation revoked successfully' };
  }



    async acceptInvitation(
    token: string,
    password: string,
  ): Promise<AcceptParentInvitationResponse> {
    const result = await this.invitationService.acceptInvitation(
      token,
      password,
      async (user: User, invitation: UserInvitation) => {
        const parent = await this.parentRepository.findOne({
          where: { email: invitation.email },
        });

        if (!parent) {
          throw new InternalServerErrorException(
            'Parent profile not found during invitation processing',
          );
        }

        parent.userId = user.id;
        parent.isActive = true;

        await this.parentRepository.save(parent);
      },
    );

    const parent = await this.parentRepository.findOne({
      where: { email: result.user.email },
    });

    if (!parent) {
      throw new InternalServerErrorException(
        'Parent profile missing after invitation accepted',
      );
    }

    return {
      message: result.message,
      user: result.user,
      tokens: result.tokens,
      parent,
      invitation: result.invitation,
      role: result.role,
    }
  }

}

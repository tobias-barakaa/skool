import {  BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, DataSource } from 'typeorm';
import { Teacher } from '../entities/teacher.entity';
import { User } from 'src/admin/users/entities/user.entity';
import { InvitationStatus, InvitationType, UserInvitation } from 'src/admin/invitation/entities/user-iInvitation.entity';
import { MembershipRole, UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { AcceptInvitationResponse } from '../dtos/accept-teacher-invitation-response.dto';
import { CreateTeacherInvitationDto } from '../dtos/create-teacher-invitation.dto';
import { EmailService } from 'src/admin/email/providers/email.service';
import { InvitationService } from 'src/admin/invitation/providers/invitation.service';
import { validateMembershipAccess } from 'src/admin/shared/utils/access.utils';
import { Subject } from 'src/admin/subject/entities/subject.entity';
import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';
import { Stream } from 'src/admin/streams/entities/streams.entity';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';
import { TenantStream } from 'src/admin/school-type/entities/tenant-stream';
import { TenantSubject } from 'src/admin/school-type/entities/tenant-specific-subject';
import { TeacherDto } from '../dtos/teacher-query.dto';
import { async } from 'rxjs';
import { handleInvitationResendLogic } from 'src/admin/shared/utils/invitation.utils';
import { PendingInvitationResponse } from '../dtos/pending-response';

@Injectable()
export class TeacherService {
  private readonly logger = new Logger(TeacherService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserTenantMembership)
    private readonly membershipRepository: Repository<UserTenantMembership>,
    private readonly emailService: EmailService,
    private readonly invitationService: InvitationService,
    @InjectRepository(UserInvitation)
    private invitationRepository: Repository<UserInvitation>,

    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
    @InjectRepository(GradeLevel)
    private gradeLevelRepository: Repository<GradeLevel>,
    @InjectRepository(Stream)
    private streamRepository: Repository<Stream>,

    @InjectRepository(TenantGradeLevel)
    private readonly tenantGradeLevelRepo: Repository<TenantGradeLevel>,

    @InjectRepository(TenantStream)
    private readonly tenantStreamRepo: Repository<TenantStream>,

    @InjectRepository(TenantSubject)
    private readonly tenantSubjectRepo: Repository<TenantSubject>,
  ) {}

  async inviteTeacher(
    dto: CreateTeacherInvitationDto,
    currentUser: ActiveUserData,
    tenantId: string,
  ) {
    this.logger.log(`Inviting teacher: ${dto.email} to tenant: ${tenantId}`);

    try {
      // Get inviter's name for email
      const inviter = await this.userRepository.findOne({
        where: { id: currentUser.sub },
        select: ['id', 'name', 'email'],
      });

      if (!inviter) {
        throw new BadRequestException('Inviter not found');
      }

      return await this.invitationService.inviteUser(
        currentUser,
        tenantId,
        dto,
        InvitationType.TEACHER,
        // Pass inviter's name instead of ID
        (email, fullName, schoolName, token, _inviterId, tenantId) =>
          this.emailService.sendTeacherInvitation(
            email,
            fullName,
            schoolName,
            token,
            inviter.name || inviter.email,
            tenantId,
          ),
        () => this.createTeacherProfile(dto, tenantId),
      );
    } catch (error) {
      this.logger.error(`Failed to invite teacher ${dto.email}:`, error);
      throw error;
    }
  }

  private async createTeacherProfile(
    dto: CreateTeacherInvitationDto,
    tenantId: string,
  ): Promise<void> {
    // Check if teacher already exists
    const existingTeacher = await this.teacherRepository.findOne({
      where: { email: dto.email, tenantId },
    });

    if (existingTeacher) {
      this.logger.log(`Teacher profile already exists for ${dto.email}`);
      return;
    }

    // Use database transaction to ensure data consistency
    await this.dataSource.transaction(async (manager) => {
      const teacherRepo = manager.getRepository(Teacher);
      const tenantGradeLevelRepo = manager.getRepository(TenantGradeLevel);
      const tenantStreamRepo = manager.getRepository(TenantStream);
      const tenantSubjectRepo = manager.getRepository(TenantSubject);

      // Fetch and validate all related entities in parallel
      const [
        tenantGradeLevels,
        tenantStreams,
        tenantSubjects,
        classTeacherStream,
      ] = await Promise.all([
        this.fetchTenantGradeLevels(
          dto.tenantGradeLevelIds,
          tenantId,
          tenantGradeLevelRepo,
        ),
        this.fetchTenantStreams(
          dto.tenantStreamIds,
          tenantId,
          tenantStreamRepo,
        ),
        this.fetchTenantSubjects(
          dto.tenantSubjectIds,
          tenantId,
          tenantSubjectRepo,
        ),
        this.fetchClassTeacherStream(
          dto.classTeacherTenantStreamId,
          tenantId,
          tenantStreamRepo,
        ),
      ]);

      // Validate relationships
      this.validateTeacherRelationships(
        dto,
        tenantGradeLevels,
        tenantStreams,
        tenantSubjects,
        classTeacherStream,
      );

      // Create teacher entity
      const teacher = teacherRepo.create({
        fullName: dto.fullName,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        gender: dto.gender,
        department: dto.department,
        phoneNumber: dto.phoneNumber,
        role: dto.role,
        address: dto.address,
        employeeId: dto.employeeId,
        dateOfBirth: dto.dateOfBirth,
        qualifications: dto.qualifications,
        isClassTeacher: dto.isClassTeacher || false,
        isActive: false,
        hasCompletedProfile: false,
        tenantId,
        tenant: { id: tenantId },
      });

      // Assign relationships
      teacher.tenantGradeLevels = tenantGradeLevels;
      teacher.tenantStreams = tenantStreams;
      teacher.tenantSubjects = tenantSubjects;

      if (dto.isClassTeacher && classTeacherStream) {
        teacher.classTeacherOf = classTeacherStream;
      }

      await teacherRepo.save(teacher);
      this.logger.log(`Teacher profile created for ${dto.email}`);
    });
  }

  private async fetchTenantGradeLevels(
    gradeLevelIds: string[] | undefined,
    tenantId: string,
    repo: Repository<TenantGradeLevel>,
  ): Promise<TenantGradeLevel[]> {
    if (!gradeLevelIds?.length) return [];

    return repo.findBy({
      id: In(gradeLevelIds),
      tenant: { id: tenantId },
    });
  }

  private async fetchTenantStreams(
    streamIds: string[] | undefined,
    tenantId: string,
    repo: Repository<TenantStream>,
  ): Promise<TenantStream[]> {
    if (!streamIds?.length) return [];

    return repo.findBy({
      id: In(streamIds),
      tenant: { id: tenantId },
    });
  }

  private async fetchTenantSubjects(
    subjectIds: string[] | undefined,
    tenantId: string,
    repo: Repository<TenantSubject>,
  ): Promise<TenantSubject[]> {
    if (!subjectIds?.length) return [];

    return repo.findBy({
      id: In(subjectIds),
      tenant: { id: tenantId },
    });
  }

  private async fetchClassTeacherStream(
    streamId: string | undefined,
    tenantId: string,
    repo: Repository<TenantStream>,
  ): Promise<TenantStream | undefined> {
    if (!streamId) return undefined;

    const stream = await repo.findOne({
      where: { id: streamId, tenant: { id: tenantId } },
    });

    return stream || undefined;
  }

  private validateTeacherRelationships(
    dto: CreateTeacherInvitationDto,
    gradeLevels: TenantGradeLevel[],
    streams: TenantStream[],
    subjects: TenantSubject[],
    classTeacherStream: TenantStream | undefined,
  ): void {
    // Validate grade levels
    if (
      dto.tenantGradeLevelIds &&
      dto.tenantGradeLevelIds.length !== gradeLevels.length
    ) {
      const foundIds = gradeLevels.map((g) => g.id);
      const missingIds = dto.tenantGradeLevelIds.filter(
        (id) => !foundIds.includes(id),
      );
      throw new BadRequestException(
        `Grade levels not found: ${missingIds.join(', ')}`,
      );
    }

    // Validate streams
    if (dto.tenantStreamIds && dto.tenantStreamIds.length !== streams.length) {
      const foundIds = streams.map((s) => s.id);
      const missingIds = dto.tenantStreamIds.filter(
        (id) => !foundIds.includes(id),
      );
      throw new BadRequestException(
        `Streams not found: ${missingIds.join(', ')}`,
      );
    }

    // Validate subjects
    if (
      dto.tenantSubjectIds &&
      dto.tenantSubjectIds.length !== subjects.length
    ) {
      const foundIds = subjects.map((s) => s.id);
      const missingIds = dto.tenantSubjectIds.filter(
        (id) => !foundIds.includes(id),
      );
      throw new BadRequestException(
        `Subjects not found: ${missingIds.join(', ')}`,
      );
    }

    // Validate class teacher stream
    if (dto.classTeacherTenantStreamId && !classTeacherStream) {
      throw new BadRequestException('Invalid class teacher stream ID');
    }

    // Validate class teacher stream is among selected streams
    if (
      dto.isClassTeacher &&
      dto.classTeacherTenantStreamId &&
      dto.tenantStreamIds?.length &&
      !dto.tenantStreamIds.includes(dto.classTeacherTenantStreamId)
    ) {
      throw new BadRequestException(
        'Class teacher stream must be among selected streams',
      );
    }
  }

  async findTeacherByUserId(
    userId: string,
    tenantId: string,
  ): Promise<Teacher | null> {
    return this.teacherRepository.findOne({
      where: { user: { id: userId }, tenantId },

      relations: [
        'tenantGradeLevels',
        'tenantStreams',
        'tenantSubjects',
        'classTeacherOf',
      ],
    });
  }

  async debugTeacherAssignments(
    userId: string,
    tenantId: string,
  ): Promise<any> {
    const teacher = await this.findTeacherByUserId(userId, tenantId);

    const debug = {
      teacherFound: !!teacher,
      teacherId: teacher?.id,
      teacherEmail: teacher?.email,
      isActive: teacher?.isActive,
      gradeLevelIds: teacher?.tenantGradeLevels?.map((g) => g.id) || [],
      streamIds: teacher?.tenantStreams?.map((s) => s.id) || [],
      subjectIds: teacher?.tenantSubjects?.map((s) => s.id) || [],
      classTeacherStreamId: teacher?.classTeacherOf?.id,
    };

    this.logger.debug('Teacher debug info:', debug);
    return debug;
  }

  // Assuming this method is in a service that injects the TeacherRepository

  async acceptInvitation(
    token: string,
    password: string,
  ): Promise<AcceptInvitationResponse> {
    const result = await this.invitationService.acceptInvitation(
      token,
      password,
      async (user: User, invitation: UserInvitation) => {
        await this.teacherRepository.update(
          { email: invitation.email },
          {
            isActive: true,
            hasCompletedProfile: true,
            user: { id: user.id }, // Correctly setting the 'user_id' foreign key via the relation
          },
        );
      },
    );

    // Fetch the teacher again, ensuring the 'user' relation is loaded
    const teacher = await this.teacherRepository.findOne({
      where: { email: result.user.email },
      relations: ['user'], // Essential to load the related User object
    });

    return {
      message: result.message,
      user: result.user,
      tokens: result.tokens,
      teacher: teacher
        ? {
            id: teacher.id,
            name: teacher.fullName,
            // --- CORRECTION: Removed 'userId' here as it no longer exists on the entity
            //                and should ideally not be a direct property in the DTO if it's redundant.
            //                If the DTO *still* requires it, see Option 2 below.
          }
        : null,
      invitation: result.invitation,
      role: result.role,
    };
  }

  async getPendingTeacherInvitations(
    tenantId: string,
    currentUser: ActiveUserData,
  ) {
    return this.invitationService.getPendingInvitationsByType(
      tenantId,
      currentUser,
      InvitationType.TEACHER,
    );
  }

  // async resendTeacherInvitation(
  //   invitationId: string,
  //   currentUser: ActiveUserData,
  //   tenantId: string,
  // ) {
  //   return this.invitationService.resendInvitation(
  //     invitationId,
  //     currentUser,
  //     tenantId,
  //     this.emailService.sendTeacherInvitation.bind(this.emailService),
  //   );
  // }

  async cancelTeacherInvitation(
    invitationId: string,
    currentUser: ActiveUserData,
    tenantId: string,
  ) {
    return this.invitationService.cancelInvitation(
      invitationId,
      currentUser,
      tenantId,
    );
  }

  async revokeInvitation(invitationId: string, currentUser: ActiveUserData) {
    const invitation = await this.invitationRepository.findOne({
      where: { id: invitationId },
      relations: ['tenant'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    await validateMembershipAccess(
      this.membershipRepository,
      currentUser.sub,
      invitation.tenant.id,
      [MembershipRole.SCHOOL_ADMIN],
    );

    await this.invitationRepository.update(invitationId, {
      status: InvitationStatus.REVOKED,
    });

    return { message: 'Invitation revoked successfully' };
  }

  // async deleteTeacher(
  //   teacherId: string,
  //   currentUserId: string,
  //   tenantId: string,
  // ) {
  //   return this.invitationService.deleteEntity(
  //     this.teacherRepository,
  //     teacherId,
  //     currentUserId,
  //     tenantId,
  //     {
  //       roles: [MembershipRole.SCHOOL_ADMIN],
  //       userIdField: 'userId',
  //       deleteUserIfOrphaned: true,
  //     },
  //   );
  // }

  async getTeachersByTenant(tenantId: string): Promise<TeacherDto[]> {
    const teachers = await this.teacherRepository.find({
      where: { tenant: { id: tenantId } }, // assumes Teacher has `tenant` relation
      relations: ['tenant'], // load tenant relation
    });

    // If entity ≠ dto fields, map manually
    return teachers.map((teacher) => ({
      id: teacher.id,
      fullName: `${teacher.firstName} ${teacher.lastName}`,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phoneNumber: teacher.phoneNumber,
      gender: teacher.gender,
      department: teacher.department,
      address: teacher.address,
      employeeId: teacher.employeeId,
      dateOfBirth: teacher.dateOfBirth
        ? new Date(teacher.dateOfBirth)
        : undefined,
      isActive: teacher.isActive,
      hasCompletedProfile: teacher.hasCompletedProfile,
    }));
  }

  async deleteTeacher(
    teacherId: string,
    currentUserId: string,
    tenantId: string,
  ) {
    return this.invitationService.deleteEntity(
      this.teacherRepository,
      teacherId,
      currentUserId,
      tenantId,
      {
        roles: [MembershipRole.SCHOOL_ADMIN],
        userIdField: 'userId',
        deleteUserIfOrphaned: true,
        // cleanupInvitations: true, // Removed as it is not a known property
        // invitationEmailField: 'email', // Removed as it is not a known property
      },
    );
  }

  async getPendingInvitation(email: string, tenantId: string) {
    return await this.invitationRepository.findOne({
      where: {
        email,
        tenant: { id: tenantId },
        status: InvitationStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getPendingInvitations(tenantId: string) {
    return await this.invitationRepository.find({
      where: {
        tenant: { id: tenantId },
        status: InvitationStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findInvitationById(
    invitationId: string,
    tenantId: string,
  ): Promise<UserInvitation | null> {
    return await this.invitationRepository.findOne({
      where: {
        id: invitationId,
        tenant: { id: tenantId },
        status: InvitationStatus.PENDING,
      },
    });
  }

  async validateResendThrottling(
    email: string,
    tenantId: string,
  ): Promise<void> {
    await handleInvitationResendLogic(
      email,
      tenantId,
      this.invitationRepository,
    );
  }

  // TeacherService handles its own resend logic
  async resendTeacherInvitation(
    invitationId: string,
    currentUser: ActiveUserData,
    tenantId: string,
  ) {
    this.logger.log(`Resending teacher invitation with ID: ${invitationId}`);

    try {
      // Get the invitation
      const invitation = await this.findInvitationById(invitationId, tenantId);

      if (!invitation) {
        throw new BadRequestException(
          'Invitation not found or already processed',
        );
      }

      if (invitation.type !== InvitationType.TEACHER) {
        throw new BadRequestException(
          'Invalid invitation type for teacher resend',
        );
      }

      // Validate throttling
      await this.validateResendThrottling(invitation.email, tenantId);

      // Get inviter info
      const inviter = await this.userRepository.findOne({
        where: { id: currentUser.sub },
        select: ['id', 'name', 'email'],
      });

      if (!inviter) {
        throw new BadRequestException('Inviter not found');
      }

      // Use existing invitation data (no need to recreate profile)
      const dto = invitation.userData as CreateTeacherInvitationDto;

      return await this.invitationService.inviteUser(
        currentUser,
        tenantId,
        dto,
        InvitationType.TEACHER,
        (email, fullName, schoolName, token, _inviterId, tenantId) =>
          this.emailService.sendTeacherInvitation(
            email,
            fullName,
            schoolName,
            token,
            inviter.name || inviter.email,
            tenantId,
          ),
        () => Promise.resolve(), // Don't create profile again on resend
      );
    } catch (error) {
      this.logger.error(
        `Failed to resend teacher invitation ${invitationId}:`,
        error,
      );
      throw error;
    }
  }
}




 // async inviteTeacher(
  //   createTeacherDto: CreateTeacherInvitationDto,
  //   currentUser: ActiveUserData,
  //   tenantId: string,
  // ) {
  //   return this.invitationService.inviteUser(
  //     currentUser,
  //     tenantId,
  //     createTeacherDto,
  //     InvitationType.TEACHER,
  //     this.emailService.sendTeacherInvitation.bind(this.emailService),
  //     async () => {
  //       const teacherExists = await this.teacherRepository.findOne({
  //         where: { email: createTeacherDto.email },
  //       });

  //       if (!teacherExists) {
  //         const teacher = this.teacherRepository.create({
  //           ...createTeacherDto,
  //           isActive: false,
  //           hasCompletedProfile: false,
  //           tenant: { id: tenantId },
  //         });

  //         await this.teacherRepository.save(teacher);
  //       }
  //     },
  //   );
  // }



























// import {  BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { In, Repository } from 'typeorm';
// import { Teacher } from '../entities/teacher.entity';
// import { User } from 'src/admin/users/entities/user.entity';
// import { InvitationStatus, InvitationType, UserInvitation } from 'src/admin/invitation/entities/user-iInvitation.entity';
// import { MembershipRole, UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
// import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
// import { AcceptInvitationResponse } from '../dtos/accept-teacher-invitation-response.dto';
// import { CreateTeacherInvitationDto } from '../dtos/create-teacher-invitation.dto';
// import { EmailService } from 'src/admin/email/providers/email.service';
// import { InvitationService } from 'src/admin/invitation/providers/invitation.service';
// import { validateMembershipAccess } from 'src/admin/shared/utils/access.utils';
// import { Subject } from 'src/admin/subject/entities/subject.entity';
// import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';
// import { Stream } from 'src/admin/streams/entities/streams.entity';
// import { SchoolSetupGuardService } from 'src/admin/config/school-config.guard';
// import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';
// import { TenantStream } from 'src/admin/school-type/entities/tenant-stream';
// import { TenantSubject } from 'src/admin/school-type/entities/tenant-specific-subject';

// @Injectable()
// export class TeacherService {
//   constructor(
//     @InjectRepository(Teacher)
//     private readonly teacherRepository: Repository<Teacher>,
//     @InjectRepository(User)
//     private readonly userRepository: Repository<User>,
//     @InjectRepository(UserTenantMembership)
//     private readonly membershipRepository: Repository<UserTenantMembership>,
//     private readonly emailService: EmailService,
//     private readonly invitationService: InvitationService,
//     @InjectRepository(UserInvitation)
//     private invitationRepository: Repository<UserInvitation>,

//     @InjectRepository(Subject)
//     private subjectRepository: Repository<Subject>,
//     @InjectRepository(GradeLevel)
//     private gradeLevelRepository: Repository<GradeLevel>,

//     @InjectRepository(Stream)
//     private streamRepository: Repository<Stream>,

//     private readonly schoolSetupGuardService: SchoolSetupGuardService,

//     @InjectRepository(TenantGradeLevel)
//     private readonly tenantGradeLevelRepo: Repository<TenantGradeLevel>,

//     @InjectRepository(TenantStream)
//     private readonly tenantStreamRepo: Repository<TenantStream>,

//     @InjectRepository(TenantSubject)
//     private readonly tenantSubjectRepo: Repository<TenantSubject>,

//   ) {}

//   async inviteTeacher(
//   dto: CreateTeacherInvitationDto,
//   currentUser: ActiveUserData,
//   tenantId: string,
// ) {
//   // 1. Re-use your tenant-role guard or manual check
//   await this.schoolSetupGuardService.validateSchoolIsConfigured(tenantId);
//   // await assertSchoolIsConfigured({ tenantId } as ActiveUserData); // global helper
//  const membership = await this.membershipRepository.findOne({
//    where: {
//      userId: currentUser.sub,
//      role: MembershipRole.SCHOOL_ADMIN,
//    },
//    relations: ['tenant'],
//  });

//     if (!membership) {
//       throw new ForbiddenException('Only school admins can create students');
//     }

//     tenantId = membership.tenantId;

//     await this.schoolSetupGuardService.validateSchoolIsConfigured(tenantId);
//   // 2. Validate every id belongs to the tenant
//   const [
//     tenantGradeLevels,
//     tenantStreams,
//     tenantSubjects,
//     classTeacherStream,
//   ] = await Promise.all([
//     dto.tenantGradeLevelIds?.length
//       ? this.tenantGradeLevelRepo.findBy({
//           id: In(dto.tenantGradeLevelIds),
//           tenant: { id: tenantId },
//         })
//       : Promise.resolve([]),

//     dto.tenantStreamIds?.length
//       ? this.tenantStreamRepo.findBy({
//           id: In(dto.tenantStreamIds),
//           tenant: { id: tenantId },
//         })
//       : Promise.resolve([]),

//     dto.tenantSubjectIds?.length
//       ? this.tenantSubjectRepo.findBy({
//           id: In(dto.tenantSubjectIds),
//           tenant: { id: tenantId },
//         })
//       : Promise.resolve([]),

//     dto.classTeacherTenantStreamId
//       ? this.tenantStreamRepo.findOne({
//           where: {
//             id: dto.classTeacherTenantStreamId,
//             tenant: { id: tenantId },
//           },
//         })
//       : Promise.resolve(undefined),
//   ]);

//   // 3. Ensure all requested ids were found
//   if (
//     dto.tenantGradeLevelIds &&
//     dto.tenantGradeLevelIds.length !== tenantGradeLevels.length
//   )
//     throw new BadRequestException('One or more grade levels not found');

//   if (dto.tenantStreamIds && dto.tenantStreamIds.length !== tenantStreams.length)
//     throw new BadRequestException('One or more streams not found');

//   if (
//     dto.tenantSubjectIds &&
//     dto.tenantSubjectIds.length !== tenantSubjects.length
//   )
//     throw new BadRequestException('One or more subjects not found');

//   if (dto.classTeacherTenantStreamId && !classTeacherStream)
//     throw new BadRequestException('Invalid class-teacher stream');







// // const token = crypto.randomBytes(32).toString('hex');
// //   const expiresAt = new Date();
// //   expiresAt.setDate(expiresAt.getDate() + 7);

// //   // Prepare student data for invitation
// //   const studentsData = validatedStudents.map(({ student, membership }) => ({
// //     id: student.id,
// //     name: membership.user.name,
// //     admissionNumber: student.admission_number,
// //     grade: String(student.grade),
// //   }));

// //   // Create invitation record with multiple students information
// //   const invitation = this.invitationRepository.create({
// //     email: createParentDto.email,
// //     name: createParentDto.name,
// //     role: MembershipRole.PARENT,
// //     userData: {
// //       ...createParentDto,
// //       fullName: createParentDto.name,
// //       students: studentsData,
// //     },
// //     token,
// //     type: InvitationType.PARENT,
// //     status: InvitationStatus.PENDING,
// //     expiresAt,
// //     invitedBy: currentUser,
// //     tenant: { id: currentUser.tenantId },
// //   });

// //   await this.invitationRepository.save(invitation);







//   // 4. Create the teacher record
//   const teacher = this.teacherRepository.create({
//     email: dto.email,
//     fullName: dto.fullName,
//     firstName: dto.firstName,
//     lastName: dto.lastName,
//     role: dto.role,
//     gender: dto.gender,
//     department: dto.department,
//     phoneNumber: dto.phoneNumber,
//     address: dto.address,
//     employeeId: dto.employeeId,
//     dateOfBirth: dto.dateOfBirth,
//     qualifications: dto.qualifications,
//     isActive: false,
//     hasCompletedProfile: false,
//     tenant: { id: tenantId },
//   });

//   (teacher.tenantGradeLevels = tenantGradeLevels);
//   teacher.tenantStreams = tenantStreams;
//   teacher.tenantSubjects = tenantSubjects;
//   teacher.classTeacherOf = classTeacherStream || undefined;

//   await this.teacherRepository.save(teacher);

// // 6. Send invitation email
// await this.emailService.sendTeacherInvitation(
//   dto.email,
//   teacher.fullName,
//   membership.tenant.name,
//   'invitationToken', // TODO: Generate or obtain invitationToken
//   currentUser.email,
//   tenantId
// );

// return {
//     email: dto.email,
//     fullName: dto.fullName,
//     status: 'INVITED',
//     createdAt: new Date(),
//   };
// }


//   async acceptInvitation(
//     token: string,
//     password: string,
//   ): Promise<AcceptInvitationResponse> {
//     const result = await this.invitationService.acceptInvitation(
//       token,
//       password,
//       async (user: User, invitation: UserInvitation) => {
//         await this.teacherRepository.update(
//           { email: invitation.email },
//           {
//             isActive: true,
//             hasCompletedProfile: true,
//             user: { id: user.id },
//           },
//         );
//       },
//     );

//     const teacher = await this.teacherRepository.findOne({
//       where: { email: result.user.email },
//     });

//     return {
//       message: result.message,
//       user: result.user,
//       tokens: result.tokens,
//       teacher: teacher
//         ? {
//             id: teacher.id,
//             name: teacher.fullName,
//           }
//         : null,
//       invitation: result.invitation,
//       role: result.role,
//     };
//   }

//   async getPendingTeacherInvitations(
//     tenantId: string,
//     currentUser: ActiveUserData,
//   ) {
//     return this.invitationService.getPendingInvitationsByType(
//       tenantId,
//       currentUser,
//       InvitationType.TEACHER,
//     );
//   }

//   async resendTeacherInvitation(
//     invitationId: string,
//     currentUser: ActiveUserData,
//     tenantId: string,
//   ) {
//     return this.invitationService.resendInvitation(
//       invitationId,
//       currentUser,
//       tenantId,
//       this.emailService.sendTeacherInvitation.bind(this.emailService),
//     );
//   }

//   async cancelTeacherInvitation(
//     invitationId: string,
//     currentUser: ActiveUserData,
//     tenantId: string,
//   ) {
//     return this.invitationService.cancelInvitation(
//       invitationId,
//       currentUser,
//       tenantId,
//     );
//   }

//   async revokeInvitation(invitationId: string, currentUser: ActiveUserData) {
//     const invitation = await this.invitationRepository.findOne({
//       where: { id: invitationId },
//       relations: ['tenant'],
//     });

//     if (!invitation) {
//       throw new NotFoundException('Invitation not found');
//     }

//     await validateMembershipAccess(
//       this.membershipRepository,
//       currentUser.sub,
//       invitation.tenant.id,
//       [MembershipRole.SCHOOL_ADMIN],
//     );

//     await this.invitationRepository.update(invitationId, {
//       status: InvitationStatus.REVOKED,
//     });

//     return { message: 'Invitation revoked successfully' };
//   }




//   // async deleteTeacher(
//   //   teacherId: string,
//   //   currentUserId: string,
//   //   tenantId: string,
//   // ) {
//   //   return this.invitationService.deleteEntity(
//   //     this.teacherRepository,
//   //     teacherId,
//   //     currentUserId,
//   //     tenantId,
//   //     {
//   //       roles: [MembershipRole.SCHOOL_ADMIN],
//   //       userIdField: 'userId',
//   //       deleteUserIfOrphaned: true,
//   //     },
//   //   );
//   // }

//   async deleteTeacher(
//     teacherId: string,
//     currentUserId: string,
//     tenantId: string,
//   ) {
//     return this.invitationService.deleteEntity(
//       this.teacherRepository,
//       teacherId,
//       currentUserId,
//       tenantId,
//       {
//         roles: [MembershipRole.SCHOOL_ADMIN],
//         userIdField: 'userId',
//         deleteUserIfOrphaned: true,
//         // cleanupInvitations: true, // Removed as it is not a known property
//         // invitationEmailField: 'email', // Removed as it is not a known property
//       },
//     );
//   }
// }






 // async inviteTeacher(
  //   createTeacherDto: CreateTeacherInvitationDto,
  //   currentUser: ActiveUserData,
  //   tenantId: string,
  // ) {
  //   return this.invitationService.inviteUser(
  //     currentUser,
  //     tenantId,
  //     createTeacherDto,
  //     InvitationType.TEACHER,
  //     this.emailService.sendTeacherInvitation.bind(this.emailService),
  //     async () => {
  //       const teacherExists = await this.teacherRepository.findOne({
  //         where: { email: createTeacherDto.email },
  //       });

  //       if (!teacherExists) {
  //         const teacher = this.teacherRepository.create({
  //           ...createTeacherDto,
  //           isActive: false,
  //           hasCompletedProfile: false,
  //           tenant: { id: tenantId },
  //         });

  //         await this.teacherRepository.save(teacher);
  //       }
  //     },
  //   );
  // }

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
import { handleInvitationResendLogic } from 'src/admin/shared/utils/invitation.utils';
import { PendingInvitationResponse } from '../dtos/pending-response';
import { ClassTeacherProvider } from './class-teacher-assign.provider';
import { AssignClassTeacherInput, UnassignClassTeacherInput } from '../dtos/assign-class-teacher.dto';
import { ClassTeacherAssignment } from '../entities/class_teacher_assignments.entity';

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

    private readonly classTeacherProvider: ClassTeacherProvider,
  ) {}

  async inviteTeacher(
    dto: CreateTeacherInvitationDto,
    currentUser: ActiveUserData,
    tenantId: string,
  ) {
    this.logger.log(`Inviting teacher: ${dto.email} to tenant: ${tenantId}`);

    try {
      const inviter = await this.userRepository.findOne({
        where: { id: currentUser.sub },
        select: ['id', 'name', 'email'],
      });
      console.log('Inviter details:', inviter);

      if (!inviter) {
        throw new BadRequestException('Inviter not found');
      }

      console.log(`Inviting teacher: ${dto.email} to tenant: ${tenantId}`);

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
    const existingTeacher = await this.teacherRepository.findOne({
      where: { email: dto.email, tenantId },
    });
  
    if (existingTeacher) {
      this.logger.log(`Teacher profile already exists for ${dto.email}`);
      return;
    }
  
    await this.dataSource.transaction(async (manager) => {
      const teacherRepo = manager.getRepository(Teacher);
      const tenantGradeLevelRepo = manager.getRepository(TenantGradeLevel);
      const tenantStreamRepo = manager.getRepository(TenantStream);
      const tenantSubjectRepo = manager.getRepository(TenantSubject);
      const classTeacherAssignmentRepo = manager.getRepository(
        ClassTeacherAssignment,
      );
  
      const [tenantGradeLevels, tenantStreams, tenantSubjects] =
        await Promise.all([
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
        ]);
  
      // Validate class teacher assignments if provided - NOW WITH PROPER ERROR HANDLING
      let classTeacherStream: TenantStream | undefined = undefined;
      let classTeacherGradeLevel: TenantGradeLevel | undefined = undefined;
  
      if (dto.classTeacherTenantStreamId) {
        classTeacherStream = await this.fetchClassTeacherStream(
          dto.classTeacherTenantStreamId,
          tenantId,
          tenantStreamRepo,
        );
      }
  
      if (dto.classTeacherTenantGradeLevelId) {
        classTeacherGradeLevel = await this.fetchClassTeacherGradeLevel(
          dto.classTeacherTenantGradeLevelId,
          tenantId,
          tenantGradeLevelRepo,
        );
      }
  
      // Validate teacher data
      this.validateTeacherData(
        dto,
        tenantGradeLevels,
        tenantStreams,
        tenantSubjects,
        classTeacherStream,
        classTeacherGradeLevel,
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
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        qualifications: dto.qualifications,
        isActive: false,
        hasCompletedProfile: false,
        tenantId,
        tenant: { id: tenantId },
      });
  
      // Assign relationships
      teacher.tenantGradeLevels = tenantGradeLevels;
      teacher.tenantStreams = tenantStreams;
      teacher.tenantSubjects = tenantSubjects;
  
      // Save teacher first to get the ID
      const savedTeacher = await teacherRepo.save(teacher);
  
      // Handle class teacher assignments - NOW GUARANTEED TO WORK OR FAIL WITH CLEAR ERROR
      if (classTeacherStream) {
        // End any existing stream class teacher assignments for this stream
        await classTeacherAssignmentRepo.update(
          { stream: { id: classTeacherStream.id }, active: true },
          { active: false, endDate: new Date() },
        );
  
        // Create new stream class teacher assignment
        const streamAssignment = classTeacherAssignmentRepo.create({
          tenant: { id: tenantId },
          teacher: { id: savedTeacher.id },
          stream: { id: classTeacherStream.id },
          active: true,
          startDate: new Date(),
        });
        await classTeacherAssignmentRepo.save(streamAssignment);
      }
  
      if (classTeacherGradeLevel) {
        // End any existing grade level class teacher assignments for this grade level
        await classTeacherAssignmentRepo.update(
          { gradeLevel: { id: classTeacherGradeLevel.id }, active: true },
          { active: false, endDate: new Date() },
        );
  
        // Create new grade level class teacher assignment
        const gradeLevelAssignment = classTeacherAssignmentRepo.create({
          tenant: { id: tenantId },
          teacher: { id: savedTeacher.id },
          gradeLevel: { id: classTeacherGradeLevel.id },
          active: true,
          startDate: new Date(),
        });
        await classTeacherAssignmentRepo.save(gradeLevelAssignment);
      }
  
      this.logger.log(`Teacher profile created for ${dto.email}`);
    });
  }

  private validateTeacherData(
    dto: CreateTeacherInvitationDto,
    tenantGradeLevels: TenantGradeLevel[],
    tenantStreams: TenantStream[],
    tenantSubjects: TenantSubject[],
    classTeacherStream?: TenantStream,
    classTeacherGradeLevel?: TenantGradeLevel,
  ): void {
    // Can't be class teacher of both stream and grade level
    if (classTeacherStream && classTeacherGradeLevel) {
      throw new BadRequestException(
        'Teacher cannot be class teacher of both a stream and grade level',
      );
    }

    // Basic relationship validations
    if (dto.tenantSubjectIds?.length && tenantSubjects.length === 0) {
      throw new BadRequestException('No valid subjects found');
    }

    if (dto.tenantStreamIds?.length && tenantStreams.length === 0) {
      throw new BadRequestException('No valid streams found');
    }

    if (dto.tenantGradeLevelIds?.length && tenantGradeLevels.length === 0) {
      throw new BadRequestException('No valid grade levels found');
    }

    // Validate class teacher assignments are within assigned relationships
    if (classTeacherStream && (dto.tenantStreamIds ?? []).length > 0) {
      const isStreamAssigned = tenantStreams.some(
        (stream) => stream.id === classTeacherStream.id,
      );
      if (!isStreamAssigned) {
        throw new BadRequestException(
          'Class teacher stream must be included in assigned streams',
        );
      }
    }

    if (classTeacherGradeLevel && (dto.tenantGradeLevelIds ?? []).length > 0) {
      const isGradeLevelAssigned = tenantGradeLevels.some(
        (gradeLevel) => gradeLevel.id === classTeacherGradeLevel.id,
      );
      if (!isGradeLevelAssigned) {
        throw new BadRequestException(
          'Class teacher grade level must be included in assigned grade levels',
        );
      }
    }
  }

  // private async fetchClassTeacherGradeLevel(
  //   gradeLevelId: string,
  //   tenantId: string,
  //   tenantGradeLevelRepo: Repository<TenantGradeLevel>,
  // ): Promise<TenantGradeLevel | undefined> {
  //   if (!gradeLevelId) return undefined;

  //   const gradeLevel = await tenantGradeLevelRepo.findOne({
  //     where: { id: gradeLevelId, tenant: { id: tenantId } },
  //   });

  //   if (!gradeLevel) {
  //     throw new BadRequestException(
  //       `Class teacher grade level with ID ${gradeLevelId} not found`,
  //     );
  //   }

  //   return gradeLevel;
  // }

  private async fetchClassTeacherGradeLevel(
    gradeLevelId: string,
    tenantId: string,
    tenantGradeLevelRepo: Repository<TenantGradeLevel>,
  ): Promise<TenantGradeLevel> {
    const gradeLevel = await tenantGradeLevelRepo.findOne({
      where: { id: gradeLevelId, tenant: { id: tenantId } },
    });
  
    if (!gradeLevel) {
      throw new BadRequestException(
        `Class teacher grade level with ID ${gradeLevelId} not found in tenant ${tenantId}`
      );
    }
  
    return gradeLevel;
  }

  // private async fetchTenantGradeLevels(
  //   gradeLevelIds: string[] | undefined,
  //   tenantId: string,
  //   repo: Repository<TenantGradeLevel>,
  // ): Promise<TenantGradeLevel[]> {
  //   if (!gradeLevelIds?.length) return [];

  //   return repo.findBy({
  //     id: In(gradeLevelIds),
  //     tenant: { id: tenantId },
  //   });
  // }

  private async fetchTenantGradeLevels(
    gradeLevelIds: string[] | undefined,
    tenantId: string,
    tenantGradeLevelRepo: Repository<TenantGradeLevel>,
  ): Promise<TenantGradeLevel[]> {
    if (!gradeLevelIds || gradeLevelIds.length === 0) {
      return [];
    }
  
    const gradeLevels = await tenantGradeLevelRepo.find({
      where: { 
        id: In(gradeLevelIds), 
        tenant: { id: tenantId }
      },
    });
  
    // Check if all requested grade levels were found
    const foundIds = gradeLevels.map(gl => gl.id);
    const missingIds = gradeLevelIds.filter(id => !foundIds.includes(id));
    
    if (missingIds.length > 0) {
      throw new BadRequestException(
        `Grade level(s) with ID(s) ${missingIds.join(', ')} not found in tenant ${tenantId}`
      );
    }
  
    return gradeLevels;
  }

  // private async fetchTenantStreams(
  //   streamIds: string[] | undefined,
  //   tenantId: string,
  //   repo: Repository<TenantStream>,
  // ): Promise<TenantStream[]> {
  //   if (!streamIds?.length) return [];

  //   return repo.findBy({
  //     id: In(streamIds),
  //     tenant: { id: tenantId },
  //   });
  // }

  private async fetchTenantStreams(
    streamIds: string[] | undefined,
    tenantId: string,
    tenantStreamRepo: Repository<TenantStream>,
  ): Promise<TenantStream[]> {
    if (!streamIds || streamIds.length === 0) {
      return [];
    }
  
    const streams = await tenantStreamRepo.find({
      where: { 
        id: In(streamIds), 
        tenant: { id: tenantId }
      },
    });
  
    
    const foundIds = streams.map(s => s.id);
    const missingIds = streamIds.filter(id => !foundIds.includes(id));
    
    if (missingIds.length > 0) {
      throw new BadRequestException(
        `Stream(s) with ID(s) ${missingIds.join(', ')} not found in tenant ${tenantId}`
      );
    }
  
    return streams;
  }

  // private async fetchTenantSubjects(
  //   subjectIds: string[] | undefined,
  //   tenantId: string,
  //   repo: Repository<TenantSubject>,
  // ): Promise<TenantSubject[]> {
  //   if (!subjectIds?.length) return [];

  //   return repo.findBy({
  //     id: In(subjectIds),
  //     tenant: { id: tenantId },
  //   });
  // }


  private async fetchTenantSubjects(
    subjectIds: string[] | undefined,
    tenantId: string,
    tenantSubjectRepo: Repository<TenantSubject>,
  ): Promise<TenantSubject[]> {
    if (!subjectIds || subjectIds.length === 0) {
      return [];
    }
  
    const subjects = await tenantSubjectRepo.find({
      where: { 
        id: In(subjectIds), 
        tenant: { id: tenantId }
      },
    });
  
    // Check if all requested subjects were found
    const foundIds = subjects.map(s => s.id);
    const missingIds = subjectIds.filter(id => !foundIds.includes(id));
    
    if (missingIds.length > 0) {
      throw new BadRequestException(
        `Subject(s) with ID(s) ${missingIds.join(', ')} not found in tenant ${tenantId}`
      );
    }
  
    return subjects;
  }

  // private async fetchClassTeacherStream(
  //   streamId: string | undefined,
  //   tenantId: string,
  //   repo: Repository<TenantStream>,
  // ): Promise<TenantStream | undefined> {
  //   if (!streamId) return undefined;

  //   const stream = await repo.findOne({
  //     where: { id: streamId, tenant: { id: tenantId } },
  //   });

  //   return stream || undefined;
  // }


  private async fetchClassTeacherStream(
    streamId: string,
    tenantId: string,
    tenantStreamRepo: Repository<TenantStream>,
  ): Promise<TenantStream> {
    const stream = await tenantStreamRepo.findOne({
      where: { id: streamId, tenant: { id: tenantId } },
    });
  
    if (!stream) {
      throw new BadRequestException(
        `Class teacher stream with ID ${streamId} not found in tenant ${tenantId}`
      );
    }
  
    return stream;
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

  async acceptInvitation(
    token: string,
    password: string,
  ): Promise<AcceptInvitationResponse> {
    const result = await this.invitationService.acceptInvitation(
      token,
      password,
      async (user: User, invitation: UserInvitation) => {
        // find teacher record for that invitation
        let teacher = await this.teacherRepository.findOne({
          where: { email: invitation.email },
          relations: ['user'],
        });

        if (teacher) {
          // already exists → just update fields
          teacher.isActive = true;
          teacher.hasCompletedProfile = true;
          teacher.user = user; // only set if not already set
          await this.teacherRepository.save(teacher);
        } else {
          // create if not exists
          teacher = this.teacherRepository.create({
            email: invitation.email,
            fullName: invitation.name,
            isActive: true,
            hasCompletedProfile: true,
            user,
          });
          await this.teacherRepository.save(teacher);
        }
      },
    );

    const teacher = await this.teacherRepository.findOne({
      where: { email: result.user.email },
      relations: ['user'],
    });

    return {
      message: result.message,
      user: result.user,
      tokens: result.tokens,
      teacher: teacher
        ? {
            id: teacher.id,
            name: teacher.fullName,
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
        () => Promise.resolve(),
      );
    } catch (error) {
      this.logger.error(
        `Failed to resend teacher invitation ${invitationId}:`,
        error,
      );
      throw error;
    }
  }

  async assign(input: AssignClassTeacherInput) {
    return this.classTeacherProvider.assign(input);
  }

  async unassign(input: UnassignClassTeacherInput) {
    return this.classTeacherProvider.unassign(input);
  }

  async getTeacherByUserId(userId: string): Promise<Teacher> {
    const teacher = await this.teacherRepository.findOne({
      where: { user: { id: userId } }, // <- match via relation
      relations: [
        'tenantSubjects',
        'tenantGradeLevels',
        'tenantStreams',
        'classTeacherAssignments',
        'classTeacherAssignments.stream',
        'classTeacherAssignments.gradeLevel',
        'user',
        'tenant',
      ],
    });

    if (!teacher) {
      throw new Error('Teacher profile not found for this user');
    }

    return teacher;
  }
}

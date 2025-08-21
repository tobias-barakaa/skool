import {  BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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

@Injectable()
export class TeacherService {
  constructor(
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
    return this.invitationService.inviteUser(
      currentUser,
      tenantId,
      dto,
      InvitationType.TEACHER,
      this.emailService.sendTeacherInvitation.bind(this.emailService),
      async () => {
        const existing = await this.teacherRepository.findOne({
          where: { email: dto.email },
        });

        if (existing) return;

        const teacher = this.teacherRepository.create({
          ...dto,
          isActive: false,
          hasCompletedProfile: false,
          tenant: { id: tenantId },
        });

        // Subjects
        const [
          tenantGradeLevels,
          tenantStreams,
          tenantSubjects,
          classTeacherStream,
        ] = await Promise.all([
          dto.tenantGradeLevelIds?.length
            ? this.tenantGradeLevelRepo.findBy({
                id: In(dto.tenantGradeLevelIds),
                tenant: { id: tenantId },
              })
            : Promise.resolve([]),

          dto.tenantStreamIds?.length
            ? this.tenantStreamRepo.findBy({
                id: In(dto.tenantStreamIds),
                tenant: { id: tenantId },
              })
            : Promise.resolve([]),

          dto.tenantSubjectIds?.length
            ? this.tenantSubjectRepo.findBy({
                id: In(dto.tenantSubjectIds),
                tenant: { id: tenantId },
              })
            : Promise.resolve([]),

          dto.classTeacherTenantStreamId
            ? this.tenantStreamRepo.findOne({
                where: {
                  id: dto.classTeacherTenantStreamId,
                  tenant: { id: tenantId },
                },
              })
            : Promise.resolve(undefined),
        ]);

        // 3. Ensure all requested ids were found
        if (
          dto.tenantGradeLevelIds &&
          dto.tenantGradeLevelIds.length !== tenantGradeLevels.length
        )
          throw new BadRequestException('One or more grade levels not found');

        if (
          dto.tenantStreamIds &&
          dto.tenantStreamIds.length !== tenantStreams.length
        )
          throw new BadRequestException('One or more streams not found');

        if (
          dto.tenantSubjectIds &&
          dto.tenantSubjectIds.length !== tenantSubjects.length
        )
          throw new BadRequestException('One or more subjects not found');

        if (dto.classTeacherTenantStreamId && !classTeacherStream)
          throw new BadRequestException('Invalid class-teacher stream');

        // Class teacher stream (only if applicable)
        if (dto.isClassTeacher && dto.classTeacherTenantStreamId) {
          // Fetch the stream and ensure it belongs to the current tenant
          const classStream = await this.tenantStreamRepo.findOne({
            where: {
              id: dto.classTeacherTenantStreamId,
              tenant: { id: tenantId },
            },
            relations: ['tenant'], // ensure tenant is loaded
          });

          if (!classStream) {
            throw new BadRequestException(
              'Invalid classTeacherStreamId or it does not belong to your tenant',
            );
          }

          // Optional: Check that classTeacherStreamId is among teacher's selected streams
          if (
            dto.tenantStreamIds?.length &&
            !dto.tenantStreamIds.includes(classStream.id)
          ) {
            throw new BadRequestException(
              'classTeacherStreamId must be one of the selected streams',
            );
          }

          // Set class teacher stream
          // teacher.classTeacherOf = classStream;
        }

        await this.teacherRepository.save(teacher);
      },
    );
  }

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
            user: { id: user.id },
          },
        );
      },
    );

    const teacher = await this.teacherRepository.findOne({
      where: { email: result.user.email },
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

  async resendTeacherInvitation(
    invitationId: string,
    currentUser: ActiveUserData,
    tenantId: string,
  ) {
    return this.invitationService.resendInvitation(
      invitationId,
      currentUser,
      tenantId,
      this.emailService.sendTeacherInvitation.bind(this.emailService),
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
      dateOfBirth: teacher.dateOfBirth ? new Date(teacher.dateOfBirth) : undefined,
      isActive: teacher.isActive,
      hasCompletedProfile: teacher.hasCompletedProfile,
      userId: teacher.userId,
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

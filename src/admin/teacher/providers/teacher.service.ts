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
  ) {}

  async inviteTeacher(
    createTeacherDto: CreateTeacherInvitationDto,
    currentUser: ActiveUserData,
    tenantId: string,
  ) {
    return this.invitationService.inviteUser(
      currentUser,
      tenantId,
      createTeacherDto,
      InvitationType.TEACHER,
      this.emailService.sendTeacherInvitation.bind(this.emailService),
      async () => {
        const existing = await this.teacherRepository.findOne({
          where: { email: createTeacherDto.email },
        });

        if (existing) return;

        const teacher = this.teacherRepository.create({
          ...createTeacherDto,
          isActive: false,
          hasCompletedProfile: false,
          tenant: { id: tenantId },
        });

        // Subjects
        if (createTeacherDto.subjectIds?.length) {
          teacher.subjects = await this.subjectRepository.findBy({
            id: In(createTeacherDto.subjectIds),
          });
        }

        // Grade Levels
        if (createTeacherDto.gradeLevelIds?.length) {
          teacher.gradeLevels = await this.gradeLevelRepository.findBy({
            id: In(createTeacherDto.gradeLevelIds),
          });
        }

        // Streams
        if (createTeacherDto.streamIds?.length) {
          teacher.streams = await this.streamRepository.findBy({
            id: In(createTeacherDto.streamIds),
          });
        }

        // Class teacher stream (only if applicable)
        if (
          createTeacherDto.isClassTeacher &&
          createTeacherDto.classTeacherStreamId
        ) {
          // Fetch the stream and ensure it belongs to the current tenant
          const classStream = await this.streamRepository.findOne({
            where: {
              id: createTeacherDto.classTeacherStreamId,
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
            createTeacherDto.streamIds?.length &&
            !createTeacherDto.streamIds.includes(classStream.id)
          ) {
            throw new BadRequestException(
              'classTeacherStreamId must be one of the selected streams',
            );
          }

          // Set class teacher stream
          teacher.classTeacherOf = classStream;
        }

        await this.teacherRepository.save(teacher);
      },
    );
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

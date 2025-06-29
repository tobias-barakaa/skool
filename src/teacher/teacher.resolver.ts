import { Resolver, Mutation, Args, Query, Context } from '@nestjs/graphql';
import { User } from '../users/entities/user.entity';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { ActiveUser } from 'src/auth/decorator/active-user.decorator';
import { TeacherService } from './providers/teacher.service';
import { CreateTeacherInvitationDto } from './dtos/create-teacher-invitation.dto';
import { InviteTeacherResponse } from './dtos/invite-teacher-response.dto';

@Resolver()
export class TeacherResolver {
  constructor(private teacherService: TeacherService) {}

  @Mutation(() => InviteTeacherResponse)
  async inviteTeacher(
    @Args('createTeacherDto') createTeacherDto: CreateTeacherInvitationDto,
    @Args('tenantId') tenantId: string,
    @ActiveUser() currentUser: User
  ) {
    return await this.teacherService.inviteTeacher(
      createTeacherDto,
      currentUser,
      tenantId
    );
  }

  @Mutation(() => String)
  async acceptTeacherInvitation(
    @Args('token') token: string,
    @Args('password') password: string
  ) {
    const result = await this.teacherService.acceptInvitation(token, password);
    return JSON.stringify(result);
  }

  @Query(() => String)
  async getPendingInvitations(
    @Args('tenantId') tenantId: string,
    @ActiveUser() currentUser: User
  ) {
    const result = await this.teacherService.getPendingInvitations(tenantId, currentUser);
    return JSON.stringify(result);
  }

  @Mutation(() => String)
  async revokeInvitation(
    @Args('invitationId') invitationId: string,
    @ActiveUser() currentUser: User
  ) {
    const result = await this.teacherService.revokeInvitation(invitationId, currentUser);
    return JSON.stringify(result);
  }
}
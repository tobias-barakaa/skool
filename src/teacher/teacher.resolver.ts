import { Resolver, Mutation, Args, Query, Context } from '@nestjs/graphql';
import { User } from '../users/entities/user.entity';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { ActiveUser } from 'src/auth/decorator/active-user.decorator';
import { TeacherService } from './providers/teacher.service';
import { CreateTeacherInvitationDto } from './dtos/create-teacher-invitation.dto';
import { InviteTeacherResponse } from './dtos/invite-teacher-response.dto';
import { AcceptInvitationResponse } from './dtos/accept-teacher-invitation-response.dto';
import { AcceptInvitationInput } from './dtos/accept-teacher-invitation.dto';

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

  @Mutation(() => AcceptInvitationResponse)
  @Auth(AuthType.None)
  async acceptTeacherInvitation(
    @Args('acceptInvitationInput', { type: () => AcceptInvitationInput }) input: AcceptInvitationInput,
    @Context() context
  ): Promise<AcceptInvitationResponse> {
   



    const { message, user, tokens, teacher } = await this.teacherService.acceptInvitation(input.token,
      input.password);

    context.res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      sameSite: 'None',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 15,
      domain: '.squl.co.ke',
    });
  
    context.res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'None',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7,
      domain: '.squl.co.ke',
    });
  
    return {
      message,
      user,
      tokens,
      teacher,
    };


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
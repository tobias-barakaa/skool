// parent.resolver.ts
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { Auth } from 'src/admin/auth/decorator/auth.decorator';
import { AuthType } from 'src/admin/auth/enums/auth-type.enum';
import { User } from '../users/entities/user.entity';
import { ParentService } from './providers/parent.service';
import { StudentSearchResponse } from './dtos/student-search-response.dto';
import { InviteParentResponse } from './dtos/invite-parent-response.dto';
import { CreateParentInvitationDto } from './dtos/accept-parent-invitation.dto';
import { AcceptParentInvitationInput, AcceptParentInvitationResponse } from './dtos/create-parent-invitation.dto';

@Resolver()
export class ParentResolver {
  constructor(private parentService: ParentService) {}

  @Query(() => [StudentSearchResponse])
  async searchStudentsByName(
    @Args('name') name: string,
    @Args('tenantId') tenantId: string,
    @ActiveUser() currentUser: User,
  ): Promise<StudentSearchResponse[]> {
    console.log('Searching students by name:', name, 'for tenant:', tenantId);
    console.log(currentUser, 'searchStudentsByName');
    return await this.parentService.searchStudentsByName(name, tenantId);
  }

  @Query(() => StudentSearchResponse, { nullable: true })
  async searchStudentByAdmission(
    @Args('admissionNumber') admissionNumber: string,
    @Args('tenantId') tenantId: string,
    @ActiveUser() currentUser: User,
  ): Promise<StudentSearchResponse | null> {
    return await this.parentService.searchStudentByAdmission(
      admissionNumber,
      tenantId,
    );
  }

  @Query(() => [StudentSearchResponse])
  async searchStudentsByManualInput(
    @Args('tenantId') tenantId: string,
    @Args('studentFullName', { nullable: true }) studentFullName?: string,
    @Args('studentGrade', { nullable: true }) studentGrade?: string,
    @Args('studentPhone', { nullable: true }) studentPhone?: string,
  ): Promise<StudentSearchResponse[]> {
    return await this.parentService.searchStudentByManualInput(
      studentFullName,
      studentGrade,
      studentPhone,
      tenantId,
    );
  }

  @Mutation(() => InviteParentResponse)
  async inviteParent(
    @Args('createParentDto') createParentDto: CreateParentInvitationDto,
    @Args('tenantId') tenantId: string,
    @Args('studentId') studentId: string,
    @ActiveUser() currentUser: User,
  ): Promise<InviteParentResponse> {
    return await this.parentService.inviteParent(
      createParentDto,
      currentUser,
      tenantId,
      studentId,
    );
  }

  @Mutation(() => AcceptParentInvitationResponse)
  @Auth(AuthType.None)
  async acceptParentInvitation(
    @Args('acceptInvitationInput') input: AcceptParentInvitationInput,
    @Context() context,
  ): Promise<AcceptParentInvitationResponse> {
    const { message, user, tokens, parent } =
      await this.parentService.acceptInvitation(input.token, input.password);

    // Set cookies same as teacher invitation
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
      parent,
    };
  }

  @Query(() => String)
  async getPendingParentInvitations(
    @Args('tenantId') tenantId: string,
    @ActiveUser() currentUser: User,
  ): Promise<string> {
    // This would be similar to teacher's pending invitations
    // You can implement this based on your needs
    return JSON.stringify([]);
  }
}

import { Args, Context, GraphQLExecutionContext, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { Auth } from 'src/admin/auth/decorator/auth.decorator';
import { AuthType } from 'src/admin/auth/enums/auth-type.enum';
import { AcceptInvitationResponse } from './dtos/accept-teacher-invitation-response.dto';
import { AcceptInvitationInput } from './dtos/accept-teacher-invitation.dto';
import { CreateTeacherInvitationDto } from './dtos/create-teacher-invitation.dto';
import { InviteTeacherResponse } from './dtos/invite-teacher-response.dto';
import { TeacherService } from './providers/teacher.service';
import { PendingInvitation } from './dtos/pending-invitation.output';
import { RevokeInvitationResponse } from './dtos/revoke-invitation.output';
import { BadRequestException, ForbiddenException, SetMetadata } from '@nestjs/common';
import { ActiveUserData } from '../auth/interface/active-user.interface';
import { setAuthCookies } from '../auth/utils/set-auth-cookies';
import { MembershipRole } from '../user-tenant-membership/entities/user-tenant-membership.entity';
import { Roles } from 'src/iam/decorators/roles.decorator';
import { SkipTenantValidation } from '../auth/decorator/skip-tenant-validation.decorator';

@Resolver()
export class TeacherResolver {
  constructor(private teacherService: TeacherService) {}

  @Roles(MembershipRole.SUPER_ADMIN, MembershipRole.SCHOOL_ADMIN)
  @Mutation(() => InviteTeacherResponse)
  async inviteTeacher(
    @Args('createTeacherDto') dto: CreateTeacherInvitationDto,
    @Args('tenantId') tenantId: string,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.teacherService.inviteTeacher(dto, user, tenantId);
  }

  @Mutation(() => AcceptInvitationResponse)
  @Auth(AuthType.None)
  @SkipTenantValidation()
  @SetMetadata('isPublic', true)
  async acceptTeacherInvitation(
    @Args('acceptInvitationInput') input: AcceptInvitationInput,
    @Context() context: GraphQLExecutionContext,
  ): Promise<AcceptInvitationResponse> {
    const { message, user, tokens, teacher, invitation, role } =
      await this.teacherService.acceptInvitation(input.token, input.password);

    setAuthCookies(context, tokens, invitation.tenant.id);

    return {
      message,
      user,
      tokens,
      teacher,
      invitation,
      role,
    };
  }

  // @Query(() => [TeacherDto])
  // async getTeachersByTenant(@Args('tenantId') tenantId: string) {
  //   return this.teacherService.getTeachersByTenant(tenantId);
  // }

  // 60660adb-416d-4d52-9efa-e3a8fc7c95c3

  @Query(() => [PendingInvitation], { name: 'getPendingInvitations' })
  async getPendingInvitations(
    @Args('tenantId', { type: () => String }) tenantId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ) {
    console.log('✅ Received tenantId from frontend:', tenantId);
    console.log('✅ Logged-in user tenantId:', currentUser.tenantId);

    if (!tenantId) {
      throw new BadRequestException('Missing tenantId');
    }

    if (tenantId.trim() !== currentUser.tenantId.trim()) {
      throw new ForbiddenException('Access denied: tenantId mismatch');
    }

    return this.teacherService.getPendingTeacherInvitations(
      tenantId,
      currentUser,
    );
  }

  @Mutation(() => RevokeInvitationResponse)
  async revokeInvitation(
    @Args('invitationId') invitationId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<RevokeInvitationResponse> {
    return await this.teacherService.revokeInvitation(
      invitationId,
      currentUser,
    );
  }

  @Mutation(() => String)
  async deleteTeacher(
    @Args('id') id: string,
    @Args('tenantId') tenantId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ) {
    const result = await this.teacherService.deleteTeacher(
      id,
      currentUser.sub,
      tenantId,
    );
    return JSON.stringify(result);
  }
}

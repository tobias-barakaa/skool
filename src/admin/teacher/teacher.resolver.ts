import { Args, Context, GqlExecutionContext, GraphQLExecutionContext, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
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
import { BadRequestException, ForbiddenException, SetMetadata, UseFilters } from '@nestjs/common';
import { ActiveUserData } from '../auth/interface/active-user.interface';
import { setAuthCookies } from '../auth/utils/set-auth-cookies';
import { MembershipRole } from '../user-tenant-membership/entities/user-tenant-membership.entity';
import { Roles } from 'src/iam/decorators/roles.decorator';
import { SkipTenantValidation } from '../auth/decorator/skip-tenant-validation.decorator';
import { TeacherDto } from './dtos/teacher-query.dto';
import { PendingInvitationResponse } from './dtos/pending-response';
import { ClassTeacherAssignment } from './entities/class_teacher_assignments.entity';
import { Teacher } from './entities/teacher.entity';
import { AssignGradeLevelClassTeacherInput, AssignStreamClassTeacherInput, UnassignClassTeacherInput } from './dtos/assign/assign-classTeacher.dto';
import { GraphQLExceptionsFilter } from '../common/filter/graphQLException.filter';

import type { Response } from 'express';   
import { Public } from '../auth/decorator/public.decorator';


@Resolver(() => Teacher)
@UseFilters(GraphQLExceptionsFilter)
export class TeacherResolver {
  constructor(private teacherService: TeacherService) {}

  @Roles(MembershipRole.SCHOOL_ADMIN)
  @Mutation(() => InviteTeacherResponse)
  async inviteTeacher(
    @Args('createTeacherDto') dto: CreateTeacherInvitationDto,
    @ActiveUser() user: ActiveUserData,
  ) {
    console.log(user.tenantId, 'this is the tenant ids');

    if (!user.tenantId) {
      throw new BadRequestException('Missing tenantId');
    }

    return this.teacherService.inviteTeacher(dto, user, user.tenantId);
  }

  @Roles(MembershipRole.SCHOOL_ADMIN)
  @Query(() => PendingInvitationResponse, { nullable: true })
  async getPendingTeacherInvitation(
    @Args('email') email: string,
    @ActiveUser() user: ActiveUserData,
  ) {

    if (!user.tenantId) {
      throw new BadRequestException('Missing tenantId');
    }
    return this.teacherService.getPendingInvitation(email, user.tenantId);
  }

  @Roles(MembershipRole.SCHOOL_ADMIN)
  @Query(() => [PendingInvitationResponse], { nullable: true })
  async getPendingTeacherInvitations(@ActiveUser() user: ActiveUserData) {
    if (!user.tenantId) {
      throw new BadRequestException('Missing tenantId');
    }
    return this.teacherService.getPendingInvitations(user.tenantId);
  }

  @Roles(MembershipRole.SCHOOL_ADMIN)
  @Mutation(() => InviteTeacherResponse)
  async resendTeacherInvitation(
    @Args('invitationId') invitationId: string,
    @ActiveUser() user: ActiveUserData,
  ) {
    if (!user.tenantId) {
      throw new BadRequestException('Missing tenantId');
    }
    return this.teacherService.resendTeacherInvitation(
      invitationId,
      user,
      user.tenantId,
    );
  }

@Public()
// @SkipTenantValidation()
// @SetMetadata('isPublic', true)
// @Mutation(() => AcceptInvitationResponse)
// @Auth(AuthType.None)
@Mutation(() => AcceptInvitationResponse, { name: 'acceptTeacherInvitation' })
async acceptTeacherInvitation(
  @Args('acceptInvitationInput') input: AcceptInvitationInput,
  @Context() context: any, // raw GraphQL context
) {
  const { message, user, tokens, teacher, invitation, role, tenant } =
    await this.teacherService.acceptInvitation(input.token, input.password);

  
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

    if (tenant && tenant.id !== undefined && tenant.id !== null) {
      context.res.cookie('tenant_id', String(tenant.id), {
        httpOnly: true,
        sameSite: 'None',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 30,
        domain: '.squl.co.ke',
      });
    }

  return { message, user, tokens, teacher, invitation, role };
}


  // @SkipTenantValidation()
  // @SetMetadata('isPublic', true)
  // @Mutation(() => AcceptInvitationResponse)
  // @Mutation(() => AcceptInvitationResponse, { name: 'acceptTeacherInvitation' })
  // @Auth(AuthType.None)
  // async acceptTeacherInvitation(
  //   @Args('acceptInvitationInput') input: AcceptInvitationInput,
  //   @Context() context: GraphQLExecutionContext,
  // ): Promise<AcceptInvitationResponse> {
  //   const { message, user, tokens, teacher, invitation, role } =
  //     await this.teacherService.acceptInvitation(input.token, input.password);




  //   setAuthCookies(context, tokens, invitation.tenant.id);

  //   return {
  //     message,
  //     user,
  //     tokens,
  //     teacher,
  //     invitation,
  //     role,
  //   };
  // }






// @Mutation(() => AuthResponse, { name: 'signIn' })
//   @Public()
//   async signIn(
//     @Args('signInInput') signInInput: SignInInput,
//     @Context() context,
//   ): Promise<AuthResponse> {
//     const result = await this.signInProvider.signIn(signInInput);

//     const { tokens, tenant } = result;

//     context.res.cookie('access_token', tokens.accessToken, {
//       httpOnly: true,
//       sameSite: 'None',
//       secure: process.env.NODE_ENV === 'production',
//       maxAge: 1000 * 60 * 15,
//       domain: '.squl.co.ke',
//     });

//     context.res.cookie('refresh_token', tokens.refreshToken, {
//       httpOnly: true,
//       sameSite: 'None',
//       secure: process.env.NODE_ENV === 'production',
//       maxAge: 1000 * 60 * 60 * 24 * 7,
//       domain: '.squl.co.ke',
//     });

//     if (tenant && tenant.id !== undefined && tenant.id !== null) {
//       context.res.cookie('tenant_id', String(tenant.id), {
//         httpOnly: true,
//         sameSite: 'None',
//         secure: process.env.NODE_ENV === 'production',
//         maxAge: 1000 * 60 * 60 * 24 * 30,
//         domain: '.squl.co.ke',
//       });
//     }

//     return result;







  @Query(() => [TeacherDto])
async getTeachersByTenants(
  @ActiveUser() currentUser: ActiveUserData,
): Promise<TeacherDto[]> {
  if (!currentUser.tenantId) {
    throw new BadRequestException('Missing tenantId');
  }
  return this.teacherService.getTeachersByTenants(currentUser.tenantId);
}

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

    if (!currentUser.tenantId) {
      throw new BadRequestException('Missing tenantId on current user');
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


 
//   @Mutation(() => ClassTeacherAssignment)
// async assignStreamClassTeacher(
//   @Args('input') input: AssignStreamClassTeacherInput,
//   @ActiveUser() currentUser: ActiveUserData,
// ): Promise<ClassTeacherAssignment> {
//   return this.teacherService.assignStreamClassTeacher(input, currentUser);
// }


@Mutation(() => ClassTeacherAssignment, { name: 'assignClassTeacher' })
async assignClassTeacher(
  @Args('input') input: AssignStreamClassTeacherInput,
  @ActiveUser() currentUser: ActiveUserData,
): Promise<ClassTeacherAssignment> {
  return this.teacherService.assignStreamClassTeacher(input, currentUser);
}

@Mutation(() => ClassTeacherAssignment)
async assignGradeLevelClassTeacher(
  @Args('input') input: AssignGradeLevelClassTeacherInput,
  @ActiveUser() currentUser: ActiveUserData,
): Promise<ClassTeacherAssignment> {
  return this.teacherService.assignGradeLevelClassTeacher(input, currentUser);
}

  
  
  @Mutation(() => Boolean)
  async unassignClassTeacher(
    @Args('input') input: UnassignClassTeacherInput,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<boolean> {
    await this.teacherService.unassignTeacherAsClassTeacher(input, currentUser);
    return true;
  }
  
  @Query(() => Teacher)
  @Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.TEACHER)
async getTeacher(
  @ActiveUser() currentUser: ActiveUserData,
): Promise<Teacher> {
  console.log('teacherrss...............................')
  console.log(currentUser.sub, 'this is user sub')
  return this.teacherService.getTeacherForCurrentUser(currentUser);
}

@Query(() => Teacher)
@Roles(MembershipRole.SCHOOL_ADMIN)
async getTeacherById(
  @ActiveUser() currentUser: ActiveUserData,
  @Args('teacherId') teacherId: string,
): Promise<Teacher> {
  console.log('tenantId', currentUser.tenantId);
const tenantId = currentUser.tenantId;
if (!tenantId) {
  throw new Error('Tenant ID is required');
}


  return this.teacherService.getTeacherByIdForTenant(teacherId, tenantId);
}


@Query(() => [Teacher])
@Roles(MembershipRole.SCHOOL_ADMIN)
async getTeachers(
  @ActiveUser() currentUser: ActiveUserData,
): Promise<Teacher[]> {
  return this.teacherService.getTeachersForTenant(currentUser);
}

  
  @Query(() => [Teacher])
  async getAllTeachers(
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<Teacher[]> {
    return this.teacherService.getAllTeachersInTenant(currentUser);
  }
  
  @Query(() => [ClassTeacherAssignment])
  async getAllClassTeacherAssignments(
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<ClassTeacherAssignment[]> {
    return this.teacherService.getAllClassTeacherAssignmentsInTenant(currentUser);
  }
  
  @Query(() => ClassTeacherAssignment, { nullable: true })
  async getStreamClassTeacher(
    @Args('streamId') streamId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<ClassTeacherAssignment | null> {
    return this.teacherService.getStreamClassTeacher(streamId, currentUser);
  }
  
  @Query(() => ClassTeacherAssignment, { nullable: true })
  async getGradeLevelClassTeacher(
    @Args('gradeLevelId') gradeLevelId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<ClassTeacherAssignment | null> {
    return this.teacherService.getGradeLevelClassTeacher(gradeLevelId, currentUser);
  }








  // @Query(() => Teacher)
  // async getTeacher(
  //   @ActiveUser() currentUser: ActiveUserData,
  // ): Promise<Teacher> {
  //   const userId = currentUser.sub;
  //   return this.teacherService.getTeacherByUserId(userId);
  // }
}

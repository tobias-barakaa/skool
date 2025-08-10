// parent.resolver.ts
import { Args, Context, GraphQLExecutionContext, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { Auth } from 'src/admin/auth/decorator/auth.decorator';
import { AuthType } from 'src/admin/auth/enums/auth-type.enum';
import { User } from '../users/entities/user.entity';
import { ParentService } from './providers/parent.service';
import { StudentSearchResponse } from './dtos/student-search-response.dto';
import { InviteParentResponse } from './dtos/invite-parent-response.dto';
import { CreateParentInvitationDto } from './dtos/accept-parent-invitation.dto';
import {
  AcceptParentInvitationInput,

} from './dtos/create-parent-invitation.dto';
import { PendingInvitation } from '../teacher/dtos/pending-invitation.output';
import { ActiveUserData } from '../auth/interface/active-user.interface';
import { RevokeInvitationResponse } from '../teacher/dtos/revoke-invitation.output';
import { Parent } from './entities/parent.entity';
import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { setAuthCookies } from '../auth/utils/set-auth-cookies';
import { AcceptInvitationInput } from '../teacher/dtos/accept-teacher-invitation.dto';
import { ParentOutput } from './dtos/parent-output';
import { AcceptParentInvitationResponse } from './dtos/accept-parent-invitation.response.dto';
import { error } from 'console';

@Resolver()
export class ParentResolver {
  constructor(private parentService: ParentService) {}

  @Query(() => [StudentSearchResponse])
  async searchStudentsByName(
    @Args('name') name: string,
    @Args('tenantId') tenantId: string,
    @ActiveUser() currentUser: ActiveUserData,
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

  @Mutation(() => AcceptParentInvitationResponse)
  @Auth(AuthType.None)
  async acceptParentInvitation(
    @Args('acceptInvitationInput') input: AcceptInvitationInput,
    @Context() context: GraphQLExecutionContext,
  ): Promise<AcceptParentInvitationResponse> {
    const { message, user, tokens, parent, invitation, role } =
      await this.parentService.acceptInvitation(input.token, input.password);

    if (!parent) {
      // This should never happen because your service now throws earlier
      throw new InternalServerErrorException('Parent profile is missing');
    }

    if (invitation?.tenant) {
      setAuthCookies(context, tokens, invitation.tenant.id);
    }

    return {
      message,
      user,
      tokens,
      parent,
      invitation,
      role,
    };
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

  // @Mutation(() => InviteParentResponse)
  // async inviteParent(
  //   @Args('createParentDto') createParentDto: CreateParentInvitationDto,
  //   @Args('tenantId') tenantId: string,
  //   @Args('studentIds', { type: () => [String] }) studentIds: string[],
  //   @ActiveUser() currentUser: ActiveUserData,
  // ): Promise<InviteParentResponse> {
  //   return await this.parentService.inviteParent(
  //     createParentDto,
  //     currentUser,
  //     tenantId,
  //     studentIds,
  //   );
  // }

  @Mutation(() => InviteParentResponse)
  async inviteParent(
    @Args('createParentDto') createParentDto: CreateParentInvitationDto,
    @Args('tenantId') tenantId: string, // Keep this for frontend compatibility
    @Args('studentIds', { type: () => [String] }) studentIds: string[],
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<InviteParentResponse> {
    // SECURITY: Validate that the provided tenantId matches the user's tenantId
    if (tenantId !== currentUser.tenantId) {
      throw new ForbiddenException(
        'Cannot invite parents for a different tenant',
      );
    }

    // Use the validated tenantId (which is the same as currentUser.tenantId)
    return await this.parentService.inviteParent(
      createParentDto,
      currentUser,
      currentUser.tenantId, // Use currentUser.tenantId instead of the argument
      studentIds,
    );
  }

  // New mutation to add students to an existing parent
  @Mutation(() => String)
  async addStudentsToParent(
    @Args('parentId') parentId: string,
    @Args('studentIds', { type: () => [String] }) studentIds: string[],
    @Args('tenantId') tenantId: string,
    @ActiveUser() currentUser: User,
  ): Promise<string> {
    const result = await this.parentService.addStudentsToParent(
      parentId,
      studentIds,
      tenantId,
      currentUser,
    );
    return result.message;
  }

  // New query to get all students for a parent
  @Query(() => [StudentSearchResponse])
  async getStudentsForParent(
    @Args('parentId') parentId: string,
    @Args('tenantId') tenantId: string,
  ): Promise<StudentSearchResponse[]> {
    return await this.parentService.getStudentsForParent(parentId, tenantId);
  }

  @Query(() => [Parent])
  async getParentsByTenant(@Args('tenantId') tenantId: string) {
    return this.parentService.getParentsByTenant(tenantId);
  }

  @Query(() => [PendingInvitation])
  async getPendingParentInvitations(
    @Args('tenantId', { type: () => String }) tenantId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ) {
    console.log('Using tenantId filter :::::', tenantId);
    console.log('Current user tenantId :::::', currentUser.tenantId);

    // 🚫 Prevent cross-tenant access
    if (tenantId.trim() !== currentUser.tenantId.trim()) {
      throw new ForbiddenException('Access denied: tenantId mismatch');
    }

    return this.parentService.getParentPendingInvitations(
      tenantId,
      currentUser,
    );
  }

  @Mutation(() => RevokeInvitationResponse)
  async revokeParentInvitation(
    @Args('invitationId') invitationId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<RevokeInvitationResponse> {
    return await this.parentService.revokeParentInvitation(
      invitationId,
      currentUser,
    );
  }

  @Query(() => [StudentSearchResponse])
  async searchAvailableStudentsForParent(
    @Args('parentId') parentId: string,
    @Args('tenantId') tenantId: string,
    @Args('searchTerm', { nullable: true }) searchTerm?: string,
  ): Promise<StudentSearchResponse[]> {
    // Get all students in the tenant
    let allStudents: StudentSearchResponse[] = [];

    if (searchTerm) {
      allStudents = await this.parentService.searchStudentsByName(
        searchTerm,
        tenantId,
      );
    } else {
      allStudents = await this.parentService.searchStudentByManualInput(
        undefined,
        undefined,
        undefined,
        tenantId,
      );
    }

    // Get students already linked to this parent
    const linkedStudents = await this.parentService.getStudentsForParent(
      parentId,
      tenantId,
    );
    const linkedStudentIds = linkedStudents.map((s) => s.id);

    // Return students not already linked to this parent
    return allStudents.filter(
      (student) => !linkedStudentIds.includes(student.id),
    );
  }
}

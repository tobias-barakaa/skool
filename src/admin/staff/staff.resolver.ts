import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { Auth } from 'src/admin/auth/decorator/auth.decorator';
import { AuthType } from 'src/admin/auth/enums/auth-type.enum';
import { StaffService } from './providers/staff.service';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { AcceptStaffInvitationInput, AcceptStaffInvitationResponse, CreateStaffInvitationDto, InviteStaffResponse, StaffDto, UpdateStaffInput } from './dtos/create-staff-invitation.dto';
import { User } from 'src/admin/users/entities/user.entity';
import { AcceptInvitationInput } from 'src/admin/teacher/dtos/accept-teacher-invitation.dto';

@Resolver()
export class StaffResolver {
  constructor(private staffService: StaffService) {}

  @Mutation(() => InviteStaffResponse)
  async inviteStaff(
    @Args('createStaffDto') createStaffDto: CreateStaffInvitationDto,
    @Args('tenantId') tenantId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ) {
    return await this.staffService.inviteStaff(
      createStaffDto,
      currentUser,
      tenantId,
    );
  }

  @Mutation(() => AcceptStaffInvitationResponse)
  @Auth(AuthType.None)
  async acceptStaffInvitation(
    @Args('acceptInvitationInput', { type: () => AcceptStaffInvitationInput })
    input: AcceptInvitationInput,
    @Context() context,
  ): Promise<AcceptStaffInvitationResponse> {
    const { message, user, tokens, staff } =
      await this.staffService.acceptInvitation(input.token, input.password);

    context.res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      sameSite: 'None',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 15, // 15 minutes
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
      staff: staff || undefined,
    };
  }

  @Query(() => [StaffDto])
  async getStaffByTenant(
    @Args('tenantId') tenantId: string,
    @ActiveUser() currentUser: User,
  ) {
    return this.staffService.getStaffByTenant(tenantId);
  }

  @Query(() => StaffDto)
  async getStaffById(
    @Args('id') id: string,
    @Args('tenantId') tenantId: string,
    @ActiveUser() currentUser: User,
  ) {
    console.log(`Fetching staff with ID: ${id} for tenant: ${tenantId}`);
    
    return this.staffService.getStaffById(id, tenantId);
  }

  // @Query(() => [StaffDto])
  // async getStaffByRole(
  //   @Args('role', { type: () => String })
  //   @Args('tenantId') tenantId: string,
  //   @ActiveUser() currentUser: User,
  // ) {
  //   return this.staffService.getStaffByRole(role, tenantId);
  // }

  @Mutation(() => StaffDto)
  async updateStaff(
    @Args('updateStaffInput') updateStaffInput: UpdateStaffInput,
    @Args('tenantId') tenantId: string,
    @ActiveUser() currentUser: User,
  ) {
    return this.staffService.updateStaff(
      updateStaffInput,
      currentUser,
      tenantId,
    );
  }

  @Mutation(() => String)
  async deleteStaff(
    @Args('id') id: string,
    @Args('tenantId') tenantId: string,
    @ActiveUser() currentUser: User,
  ) {
    const result = await this.staffService.deleteStaff(
      id,
      currentUser,
      tenantId,
    );
    return JSON.stringify(result);
  }

  @Query(() => String)
  async getPendingStaffInvitations(
    @Args('tenantId') tenantId: string,
    @ActiveUser() currentUser: User,
  ) {
    const result = await this.staffService.getPendingInvitations(
      tenantId,
      currentUser,
    );
    return JSON.stringify(result);
  }

  @Mutation(() => String)
  async revokeStaffInvitation(
    @Args('invitationId') invitationId: string,
    @ActiveUser() currentUser: User,
  ) {
    const result = await this.staffService.revokeInvitation(
      invitationId,
      currentUser,
    );
    return JSON.stringify(result);
  }

  // @Query(() => [String])
  // async getStaffRoles() {
  //   return Object.values(StaffRole);
  // }

  @Query(() => [StaffDto])
  async getActiveStaffByTenant(
    @Args('tenantId') tenantId: string,
    @ActiveUser() currentUser: User,
  ) {
    return this.staffService.getActiveStaffByTenant(tenantId);
  }

  @Query(() => [StaffDto])
  async getStaffByDepartment(
    @Args('department') department: string,
    @Args('tenantId') tenantId: string,
    @ActiveUser() currentUser: User,
  ) {
    return this.staffService.getStaffByDepartment(department, tenantId);
  }

  @Query(() => Number)
  async getStaffCount(
    @Args('tenantId') tenantId: string,
    @ActiveUser() currentUser: User,
  ) {
    return this.staffService.getStaffCount(tenantId);
  }

  @Query(() => [StaffDto])
  async searchStaff(
    @Args('searchTerm') searchTerm: string,
    @Args('tenantId') tenantId: string,
    @ActiveUser() currentUser: User,
  ) {
    return this.staffService.searchStaff(searchTerm, tenantId);
  }
}

import { Args, Context, GraphQLExecutionContext, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { Auth } from 'src/admin/auth/decorator/auth.decorator';
import { AuthType } from 'src/admin/auth/enums/auth-type.enum';
import { StaffService } from './providers/staff.service';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { AcceptStaffInvitationInput, AcceptStaffInvitationResponse, CreateStaffInvitationDto, InviteStaffResponse, StaffDto, UpdateStaffInput } from './dtos/create-staff-invitation.dto';
import { User } from 'src/admin/users/entities/user.entity';
import { AcceptInvitationInput } from 'src/admin/teacher/dtos/accept-teacher-invitation.dto';
import { setAuthCookies } from '../auth/utils/set-auth-cookies';
import { SetMetadata } from '@nestjs/common';
import { SkipTenantValidation } from '../auth/decorator/skip-tenant-validation.decorator';
import { Roles } from 'src/iam/decorators/roles.decorator';
import { MembershipRole } from '../user-tenant-membership/entities/user-tenant-membership.entity';

@Resolver()
@Roles(
  MembershipRole.SUPER_ADMIN,
  MembershipRole.SCHOOL_ADMIN,
)
export class StaffResolver {
  constructor(private readonly staffService: StaffService) {}

  @Mutation(() => InviteStaffResponse)
  async inviteStaff(
    @Args('createStaffDto') createStaffDto: CreateStaffInvitationDto,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<InviteStaffResponse> {
    console.log(Object.keys(createStaffDto), 'DTO keys');
    console.log(currentUser.tenantId, 'Current user tenant ID');
    console.log(createStaffDto, 'Received createStaffDto');

    return await this.staffService.inviteStaff(createStaffDto, currentUser);
  }

  
  @Mutation(() => AcceptStaffInvitationResponse)
  @Auth(AuthType.None)
  @SkipTenantValidation()
  @SetMetadata('isPublic', true)
  async acceptStaffInvitation(
    @Args('acceptInvitationInput', { type: () => AcceptStaffInvitationInput })
    input: AcceptInvitationInput,
    @Context() context: GraphQLExecutionContext,
  ): Promise<AcceptStaffInvitationResponse> {
    const { message, user, tokens, staff, invitation, role } =
      await this.staffService.acceptInvitation(input.token, input.password);

    setAuthCookies(context, tokens, invitation.tenant.id);

    return {
      message,
      user,
      tokens,
      staff: staff || undefined,
      invitation,
      role,
    };
  }

  @Query(() => [StaffDto])
  async getAllStaff(
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<StaffDto[]> {
    return await this.staffService.getAllStaff(currentUser.tenantId);
  }

  @Query(() => StaffDto)
  async getStaffById(
    @Args('id', { type: () => ID }) id: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<StaffDto> {
    return await this.staffService.getStaffById(id, currentUser.tenantId);
  }

  @Mutation(() => StaffDto)
  async updateStaff(
    @Args('updateInput') updateInput: UpdateStaffInput,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<StaffDto> {
    return await this.staffService.updateStaff(updateInput, currentUser.tenantId);
  }

  @Mutation(() => Boolean)
  async deleteStaff(
    @Args('id', { type: () => ID }) id: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<boolean> {
    return await this.staffService.deleteStaff(id, currentUser.tenantId);
  }
}
// export class StaffResolver {
//   constructor(private staffService: StaffService) {}

//   @Mutation(() => InviteStaffResponse)
//   async inviteStaff(
//     @Args('createStaffDto') createStaffDto: CreateStaffInvitationDto,
//     @Args('tenantId') tenantId: string,
//     @ActiveUser() currentUser: ActiveUserData,
//   ) {
//     console.log(Object.keys(createStaffDto), 'DTO keys');
//     console.log(tenantId, 'this is the tenant id');
//     console.log(currentUser.tenantId, 'this is the user tenant id');
//     console.log(createStaffDto, 'received createStaffDto');

//     return await this.staffService.inviteStaff(
//       createStaffDto,
//       currentUser,
//       tenantId,
//     );
//   }

//   @Mutation(() => AcceptStaffInvitationResponse)
//   @Auth(AuthType.None)
//   @SkipTenantValidation()
//   @SetMetadata('isPublic', true)
//   async acceptStaffInvitation(
//     @Args('acceptInvitationInput', { type: () => AcceptStaffInvitationInput })
//     input: AcceptInvitationInput,
//     @Context() context: GraphQLExecutionContext,
//   ): Promise<AcceptStaffInvitationResponse> {
//     const { message, user, tokens, staff, invitation, role } =
//       await this.staffService.acceptInvitation(input.token, input.password);

//     setAuthCookies(context, tokens, invitation.tenant.id);

//     return {
//       message,
//       user,
//       tokens,
//       staff: staff || undefined,
//       invitation,
//       role,
//     };
//   }

//   @Query(() => [StaffDto])
//   async getStaffByTenant(
//     @Args('tenantId') tenantId: string,
//     @ActiveUser() currentUser: User,
//   ) {
//     return this.staffService.getStaffByTenant(tenantId);
//   }

//   @Query(() => StaffDto)
//   async getStaffById(
//     @Args('id') id: string,
//     @Args('tenantId') tenantId: string,
//     @ActiveUser() currentUser: User,
//   ) {
//     console.log(`Fetching staff with ID: ${id} for tenant: ${tenantId}`);

//     return this.staffService.getStaffById(id, tenantId);
//   }


//   @Mutation(() => StaffDto)
//   async updateStaff(
//     @Args('updateStaffInput') updateStaffInput: UpdateStaffInput,
//     @Args('tenantId') tenantId: string,
//     @ActiveUser() currentUser: User,
//   ) {
//     return this.staffService.updateStaff(
//       updateStaffInput,
//       currentUser,
//       tenantId,
//     );
//   }

//   @Mutation(() => String)
//   async deleteStaff(
//     @Args('id') id: string,
//     @Args('tenantId') tenantId: string,
//     @ActiveUser() currentUser: User,
//   ) {
//     const result = await this.staffService.deleteStaff(
//       id,
//       currentUser,
//       tenantId,
//     );
//     return JSON.stringify(result);
//   }

//   @Query(() => String)
//   async getPendingStaffInvitations(
//     @Args('tenantId') tenantId: string,
//     @ActiveUser() currentUser: User,
//   ) {
//     const result = await this.staffService.getPendingInvitations(
//       tenantId,
//       currentUser,
//     );
//     return JSON.stringify(result);
//   }

//   @Mutation(() => String)
//   async revokeStaffInvitation(
//     @Args('invitationId') invitationId: string,
//     @ActiveUser() currentUser: User,
//   ) {
//     const result = await this.staffService.revokeInvitation(
//       invitationId,
//       currentUser,
//     );
//     return JSON.stringify(result);
//   }

//   // @Query(() => [String])
//   // async getStaffRoles() {
//   //   return Object.values(StaffRole);
//   // }

//   @Query(() => [StaffDto])
//   async getActiveStaffByTenant(
//     @Args('tenantId') tenantId: string,
//     @ActiveUser() currentUser: User,
//   ) {
//     return this.staffService.getActiveStaffByTenant(tenantId);
//   }

//   @Query(() => [StaffDto])
//   async getStaffByDepartment(
//     @Args('department') department: string,
//     @Args('tenantId') tenantId: string,
//     @ActiveUser() currentUser: User,
//   ) {
//     return this.staffService.getStaffByDepartment(department, tenantId);
//   }

//   @Query(() => Number)
//   async getStaffCount(
//     @Args('tenantId') tenantId: string,
//     @ActiveUser() currentUser: User,
//   ) {
//     return this.staffService.getStaffCount(tenantId);
//   }

//   @Query(() => [StaffDto])
//   async searchStaff(
//     @Args('searchTerm') searchTerm: string,
//     @Args('tenantId') tenantId: string,
//     @ActiveUser() currentUser: User,
//   ) {
//     return this.staffService.searchStaff(searchTerm, tenantId);
//   }
// }




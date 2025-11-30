import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { SuperAdminAuthService } from './providers/super-admin-auth.service';
import { SuperAdminAuthResponse } from './dtos/super-admin-auth.response';
import { SuperAdminSignupInput } from './dtos/super-admin-signup.input';
import { Auth } from 'src/admin/auth/decorator/auth.decorator';
import { SkipTenantValidation } from 'src/admin/auth/decorator/skip-tenant-validation.decorator';
import { SetMetadata, UseGuards } from '@nestjs/common';
import { AuthType } from 'src/admin/auth/enums/auth-type.enum';
import { SkipSchoolConfigCheck } from 'src/iam/guards/school-setup-guard-service';
import { IsGlobalAdmin } from 'src/admin/auth/decorator/is-global-admin.decorator';
import { User } from 'src/admin/users/entities/user.entity';
import { SuperAdminOnly } from 'src/admin/auth/decorator/super-admin.decorator';
import { SkipTenant } from 'src/admin/auth/decorator/skip-tenant.decorator';
import { Public } from 'src/admin/auth/decorator/public.decorator';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { Roles } from 'src/admin/auth/decorator/roles.decorator';
import { MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';

@Resolver()
export class SuperAdminAuthResolver {
  constructor(private readonly superAdminAuthService: SuperAdminAuthService) {}

  @Mutation(() => SuperAdminAuthResponse)

//    @Mutation(() => AuthResponse, { name: 'signIn' })
        // @Auth(AuthType.None)
        // @SkipTenantValidation()
        // @SetMetadata('isPublic', true)
  
  
        //  @Mutation(() => AcceptInvitationResponse)

  //       @SuperAdminAuth()

  // @Auth(AuthType.None)
  // @SkipTenantValidation()
  // @SetMetadata('isPublic', true)
  // @SkipSchoolConfigCheck()
  // @SuperAdminOnly()
  @Public()
@Mutation(() => SuperAdminAuthResponse)
async superAdminSignup(@Args('input') input: SuperAdminSignupInput) {
  return this.superAdminAuthService.signup(input);
}




@Roles(MembershipRole.SUPER_ADMIN)
  @Query(() => [User])
  async getAllUsers(@ActiveUser() user: ActiveUserData) {
    console.log(user,'this is the user please')
    return this.superAdminAuthService.getAllUsers();
  }
  
}

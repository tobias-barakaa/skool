import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { SuperAdminAuthService } from './providers/super-admin-auth.service';
import { SuperAdminAuthResponse } from './dtos/super-admin-auth.response';
import { SuperAdminSignupInput } from './dtos/super-admin-signup.input';
import { Auth } from 'src/admin/auth/decorator/auth.decorator';
import { SkipTenantValidation } from 'src/admin/auth/decorator/skip-tenant-validation.decorator';
import { SetMetadata, UseGuards } from '@nestjs/common';
import { AuthType } from 'src/admin/auth/enums/auth-type.enum';
import { SkipSchoolConfigCheck } from 'src/iam/guards/school-setup-guard-service';
import { GlobalAdminGuard } from 'src/admin/auth/guards/global-admin.guard';
import { IsGlobalAdmin } from 'src/admin/auth/decorator/is-global-admin.decorator';
import { User } from 'src/admin/users/entities/user.entity';
import { SuperAdminAuth } from 'src/admin/auth/decorator/super-admin.decorator';

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
  async superAdminSignup(
    @Args('input') input: SuperAdminSignupInput,
  ): Promise<SuperAdminAuthResponse> {
    return this.superAdminAuthService.signup(input);
  }


  @Query(() => [User])
  async getAllUsers() {
    return this.superAdminAuthService.getAllUsers();
  }
  
}

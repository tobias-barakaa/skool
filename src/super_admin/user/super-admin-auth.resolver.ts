import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { SuperAdminAuthService } from './providers/super-admin-auth.service';
import { SuperAdminAuthResponse } from './dtos/super-admin-auth.response';
import { SuperAdminSignupInput } from './dtos/super-admin-signup.input';
import { Auth } from 'src/admin/auth/decorator/auth.decorator';
import { SkipTenantValidation } from 'src/admin/auth/decorator/skip-tenant-validation.decorator';
import { SetMetadata } from '@nestjs/common';
import { AuthType } from 'src/admin/auth/enums/auth-type.enum';
import { SkipSchoolConfigCheck } from 'src/iam/guards/school-setup-guard-service';

@Resolver()
export class SuperAdminAuthResolver {
  constructor(private readonly superAdminAuthService: SuperAdminAuthService) {}

  @Mutation(() => SuperAdminAuthResponse)

//    @Mutation(() => AuthResponse, { name: 'signIn' })
        // @Auth(AuthType.None)
        // @SkipTenantValidation()
        // @SetMetadata('isPublic', true)
  
  
        //  @Mutation(() => AcceptInvitationResponse)
  @Auth(AuthType.None)
  @SkipTenantValidation()
  @SetMetadata('isPublic', true)
  @SkipSchoolConfigCheck()
  async superAdminSignup(
    @Args('input') input: SuperAdminSignupInput,
  ): Promise<SuperAdminAuthResponse> {
    return this.superAdminAuthService.signup(input);
  }
  
}

import { SetMetadata, UseFilters } from '@nestjs/common';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { Auth } from 'src/admin/auth/decorator/auth.decorator';
import { AuthType } from 'src/admin/auth/enums/auth-type.enum';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { Repository } from 'typeorm';
import { SkipTenantValidation } from './decorator/skip-tenant-validation.decorator';
import { ChangePasswordInput } from './dtos/change-password.dto';
import {
  ForgotPasswordInput,
  PasswordResetResponse,
  ResetPasswordInput,
} from './dtos/password-reset.dto';
import { AuthResponse, SignInInput } from './dtos/signin-input.dto';
import { ChangePasswordProvider } from './providers/change-password.provider';
import { ForgotPasswordProvider } from './providers/forgot-password.provider';
import { SignInProvider } from './providers/sign-in.provider';
import { GraphQLExceptionsFilter } from '../common/filter/graphQLException.filter';
import { User } from '../users/entities/user.entity';
import { MembershipRole } from '../user-tenant-membership/entities/user-tenant-membership.entity';
import { Roles } from 'src/iam/decorators/roles.decorator';
import { SkipSchoolConfigCheck } from 'src/iam/guards/school-setup-guard-service';

@Resolver()
@UseFilters(GraphQLExceptionsFilter)
export class AuthResolver {
  constructor(
    private readonly signInProvider: SignInProvider,
    private readonly forgotPasswordProvider: ForgotPasswordProvider,
    private readonly changePasswordProvider: ChangePasswordProvider,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Mutation(() => AuthResponse, { name: 'signIn' })
      // @Auth(AuthType.None)
      // @SkipTenantValidation()
      // @SetMetadata('isPublic', true)


      //  @Mutation(() => AcceptInvitationResponse)
        @Auth(AuthType.None)
        @SkipTenantValidation()
        @SetMetadata('isPublic', true)
        @SkipSchoolConfigCheck()
        

  async signIn(
    @Args('signInInput') signInInput: SignInInput,
    @Context() context,
  ): Promise<AuthResponse> {
    const result = await this.signInProvider.signIn(signInInput);

    const { tokens, tenant } = result;

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

    return result;
  }

  @Mutation(() => PasswordResetResponse, { name: 'forgotPassword' })
  @Auth(AuthType.None)
  async forgotPassword(
    @Args('forgotPasswordInput') forgotPasswordInput: ForgotPasswordInput,
    @Context() context,
  ): Promise<PasswordResetResponse> {
    const host = context.req.headers.host;
    const subdomain = host.split('.')[0];
    console.log(
      'Subdomain::::::::::::::::::::::::::::://///////////////////////',
      subdomain,
    );
    return await this.forgotPasswordProvider.sendResetPasswordEmail(
      forgotPasswordInput,
    );
  }

  @Mutation(() => PasswordResetResponse, { name: 'resetPassword' })
  @Auth(AuthType.None)
  async resetPassword(
    @Args('resetPasswordInput') resetPasswordInput: ResetPasswordInput,
  ): Promise<PasswordResetResponse> {
    if (resetPasswordInput.newPassword !== resetPasswordInput.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    return await this.forgotPasswordProvider.resetPassword(resetPasswordInput);
  }

  @Mutation(() => PasswordResetResponse, { name: 'changePassword' })
  @Auth(AuthType.None)
  @SkipTenantValidation()
  @SetMetadata('isPublic', true)
  @SkipSchoolConfigCheck()
  async changePassword(
    @Args('changePasswordInput') changePasswordInput: ChangePasswordInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<PasswordResetResponse> {
    if (changePasswordInput.newPassword !== changePasswordInput.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    return await this.changePasswordProvider.changePassword(
      user.sub,
      changePasswordInput,
    );
  }
}

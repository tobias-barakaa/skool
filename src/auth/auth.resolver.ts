import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UseFilters } from '@nestjs/common';
import { GraphQLExceptionsFilter } from 'src/common/filter/graphQLException.filter';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { ActiveUser } from 'src/auth/decorator/active-user.decorator';
import { ActiveUserData } from 'src/auth/interface/active-user.interface';
import { ForgotPasswordProvider } from './providers/forgot-password.provider';
import { ChangePasswordProvider } from './providers/change-password.provider';
import { SignInProvider } from './providers/sign-in.provider';
import { ChangePasswordInput } from './dtos/change-password.dto';
import { PasswordResetResponse,

    ForgotPasswordInput, 
    ResetPasswordInput, 
 } from './dtos/password-reset.dto';
import { AuthResponse, SignInInput } from './dtos/signin-input.dto';

@Resolver()
@UseFilters(GraphQLExceptionsFilter)
export class AuthResolver {
  constructor(
    private readonly signInProvider: SignInProvider,
    private readonly forgotPasswordProvider: ForgotPasswordProvider,
    private readonly changePasswordProvider: ChangePasswordProvider,
  ) {}

  @Mutation(() => AuthResponse, { name: 'signIn' })
  @Auth(AuthType.None)
  async signIn(
    @Args('signInInput') signInInput: SignInInput,
    @Context() context,
  ): Promise<AuthResponse> {
    // Extract subdomain from request headers
    const host = context.req.headers.host;
    // const host = "whatdstheshoolname.squl.co.ke";

    const subdomain = host.split('.')[0];

    const result = await this.signInProvider.signIn(signInInput, subdomain);

    // Set cookies
    context.res.cookie('access_token', result.tokens.accessToken, {
      httpOnly: true,
      sameSite: 'None',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 15, 
      domain: '.squl.co.ke',
    });

    context.res.cookie('refresh_token', result.tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'None',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7, 
      domain: '.squl.co.ke',
    });

    return result;
  }

  @Mutation(() => PasswordResetResponse, { name: 'forgotPassword' })
  @Auth(AuthType.None)
  async forgotPassword(
    @Args('forgotPasswordInput') forgotPasswordInput: ForgotPasswordInput,
    @Context() context,
  ): Promise<PasswordResetResponse> {
    const host = context.req.headers.host;
    // const host = "whatdstheshoolname.squl.co.ke";
    const subdomain = host.split('.')[0];

    return await this.forgotPasswordProvider.sendResetPasswordEmail(forgotPasswordInput, subdomain);
  }

  @Mutation(() => PasswordResetResponse, { name: 'resetPassword' })
  @Auth(AuthType.None)
  async resetPassword(
    @Args('resetPasswordInput') resetPasswordInput: ResetPasswordInput,
  ): Promise<PasswordResetResponse> {
    // Validate password confirmation
    if (resetPasswordInput.newPassword !== resetPasswordInput.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    return await this.forgotPasswordProvider.resetPassword(resetPasswordInput);
  }

  @Mutation(() => PasswordResetResponse, { name: 'changePassword' })
  @Auth(AuthType.Bearer)
  async changePassword(
    @Args('changePasswordInput') changePasswordInput: ChangePasswordInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<PasswordResetResponse> {
    // Validate password confirmation
    if (changePasswordInput.newPassword !== changePasswordInput.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    return await this.changePasswordProvider.changePassword(user.sub, changePasswordInput);
  }
}

import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './providers/auth.service';
import { SignInProvider } from './providers/sign-in.provider';
import { HashingProvider } from './providers/hashing.provider';
import { GenerateTokenProvider } from './providers/generate-token.provider';
import { ConfigModule } from '@nestjs/config';
import jwtConfig from './config/jwt.config';
import { JwtModule } from '@nestjs/jwt';
import { BcryptProvider } from './providers/bcrypt.provider';
import { TenantsModule } from 'src/admin/tenants/tenants.module';
import { AuthResolver } from './auth.resolver';
import { RefreshTokensProvider } from './providers/refresh-token.provider';
import { ForgotPasswordProvider } from './providers/forgot-password.provider';
import { ChangePasswordProvider } from './providers/change-password.provider';
import { EmailService } from 'src/admin/email/providers/email.service';
import { EmailModule } from 'src/admin/email/email.module';
import { TenantValidationProvider } from './providers/tenant-validation.provider';
import { APP_GUARD } from '@nestjs/core';
import { TenantAccessGuard } from './guards/tenant-access.guard';
import { UserModule } from '../users/users.module';
import { UserTenantMembershipModule } from '../user-tenant-membership/user-tenant-membership.module';

@Module({
  providers: [AuthService, SignInProvider, { provide: HashingProvider, useClass: BcryptProvider },
    BcryptProvider, GenerateTokenProvider, AuthResolver, RefreshTokensProvider, ForgotPasswordProvider, ChangePasswordProvider, SignInProvider, TenantValidationProvider
  ],
  imports: [forwardRef(() => UserModule), ConfigModule.forFeature(jwtConfig), EmailModule,JwtModule.registerAsync(jwtConfig.asProvider()), TenantsModule, UserTenantMembershipModule ],
  exports: [AuthService, HashingProvider, GenerateTokenProvider],
})
export class AuthModule {}

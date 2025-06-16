import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './providers/auth.service';
import { SignInProvider } from './providers/sign-in.provider';
import { HashingProvider } from './providers/hashing.provider';
import { GenerateTokenProvider } from './providers/generate-token.provider';
import { UserModule } from 'src/users/users.module';
import { ConfigModule } from '@nestjs/config';
import jwtConfig from './config/jwt.config';
import { JwtModule } from '@nestjs/jwt';
import { BcryptProvider } from './providers/bcrypt.provider';
import { RefreshTokensProvider } from './providers/refresh-token.provider';

@Module({
  providers: [AuthService, SignInProvider, { provide: HashingProvider, useClass: BcryptProvider }, BcryptProvider, GenerateTokenProvider],
  imports: [forwardRef(() => UserModule), ConfigModule.forFeature(jwtConfig),JwtModule.registerAsync(jwtConfig.asProvider()) ],
  exports: [AuthService, HashingProvider, GenerateTokenProvider],
})
export class AuthModule {}

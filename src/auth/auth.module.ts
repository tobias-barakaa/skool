import { Module } from '@nestjs/common';
import { AuthService } from './providers/auth.service';
import { AuthCreateProviderService } from './providers/auth.create.provider.service';

@Module({
  providers: [AuthService, AuthCreateProviderService]
})
export class AuthModule {}

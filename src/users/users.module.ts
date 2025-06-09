import { Module } from '@nestjs/common';
import { UsersService } from './providers/users.service';
import { UsersCreateProvider } from './providers/users-create.provider';

@Module({
  providers: [UsersService, UsersCreateProvider]
})
export class UsersModule {}

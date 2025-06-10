import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { SchoolsModule } from 'src/school/school.module';
import { UsersCreateProvider } from './providers/users-create.provider';
import { UsersService } from './providers/users.service';
import { UsersResolver } from './users.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([User]), SchoolsModule], 
  providers: [UsersService,UsersCreateProvider, UsersResolver],
  exports: [UsersService],
})
export class UserModule {}

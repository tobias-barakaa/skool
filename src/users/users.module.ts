import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './providers/users.service';
import { UserResolver } from './users.resolver';
import { SchoolsModule } from 'src/school/school.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), SchoolsModule], // <-- add here
  providers: [UserService, UserResolver],
  exports: [UserService],
})
export class UserModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { StudentsService } from './providers/student.service';
import { UsersCreateStudentProvider } from './providers/student.create.provider';
import { UserTenantMembershipModule } from 'src/user-tenant-membership/user-tenant-membership.module';
import { AuthModule } from 'src/auth/auth.module';
import { StudentsResolver } from './students.resolver';
import { StudentQueryProvider } from './providers/student-query.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Student]), UserTenantMembershipModule, AuthModule], 
  providers: [StudentsService, UsersCreateStudentProvider, StudentsResolver, StudentQueryProvider],
  exports: [TypeOrmModule],
})
export class StudentModule {}

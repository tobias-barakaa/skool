import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/admin/auth/auth.module';
import { Student } from './entities/student.entity';
import { StudentQueryProvider } from './providers/student-query.provider';
import { UsersCreateStudentProvider } from './providers/student.create.provider';
import { StudentsService } from './providers/student.service';
import { StudentsResolver } from './students.resolver';
import { UserTenantMembershipModule } from '../user-tenant-membership/user-tenant-membership.module';
import { SchoolTypeModule } from '../school-type/school-type.module';
import { SchoolConfigModule } from '../config/config.module';
import { StudentSummaryResolver } from './student-summary.resolver';
import { StudentSummaryService } from './providers/student-summary.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student]),
    UserTenantMembershipModule,
    AuthModule,
    SchoolTypeModule,
    SchoolConfigModule,
  ],
  providers: [
    StudentsService,
    UsersCreateStudentProvider,
    StudentsResolver,
    StudentQueryProvider,
    StudentSummaryService,
    StudentSummaryResolver
  ],
  exports: [TypeOrmModule],
})
export class StudentModule {}

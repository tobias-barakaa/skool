import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from 'src/admin/email/email.module';
import { TenantsModule } from 'src/admin/tenants/tenants.module';
import { Teacher } from './entities/teacher.entity';
import { TeacherService } from './providers/teacher.service';
import { TeacherResolver } from './teacher.resolver';
import { UserModule } from '../users/users.module';
import { InvitationModule } from '../invitation/invitation.module';
import { UserTenantMembershipModule } from '../user-tenant-membership/user-tenant-membership.module';
import { SubjectModule } from '../subject/subject.module';
import { LevelModule } from '../level/level.module';
import { StreamsModule } from '../streams/streams.module';
import { TenantGradeLevel } from '../school-type/entities/tenant-grade-level';
import { TenantStream } from '../school-type/entities/tenant-stream';
import { TenantSubject } from '../school-type/entities/tenant-specific-subject';
import { AuthModule } from '../auth/auth.module';
import { ClassTeacherAssignment } from './entities/class_teacher_assignments.entity';
import { ClassTeacherProvider } from './providers/class-teacher-assign.provider';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Teacher,
      TenantGradeLevel,
      TenantStream,
      TenantSubject,
      ClassTeacherAssignment,
    ]),
    forwardRef(() => InvitationModule),
    SubjectModule,
    LevelModule,
    StreamsModule,
    forwardRef(() => AuthModule),
    TenantsModule,
    UserTenantMembershipModule,
    EmailModule,
    forwardRef(() => UserModule),
  ],
  providers: [TeacherService, TeacherResolver, ClassTeacherProvider],
  exports: [TypeOrmModule],
})
export class TeacherModule {}

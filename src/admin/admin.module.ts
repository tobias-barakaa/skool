import { Module } from '@nestjs/common';
import { UserModule } from "./users/users.module";
import { SchoolsModule } from './school/school.module';
import { TeacherModule } from './teacher/teacher.module';
import { SchoolTypeModule } from './school-type/school-type.module';
import { ParentModule } from './parent/parent.module';
import { StudentModule } from './student/student.module';
import { GradeModule } from './grade/grade.module';
import { SubjectModule } from './subject/subject.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { TenantsModule } from './tenants/tenants.module';
import { LevelModule } from './level/level.module';
import { SchoolLevelSettingModule } from './school-level-setting/school-level-setting.module';
import { CurriculumModule } from './curriculum/curriculum.module';
import { StreamsModule } from './streams/streams.module';
import { UserTenantMembershipModule } from './user-tenant-membership/user-tenant-membership.module';
import { InvitationModule } from './invitation/invitation.module';
import { TeacherProfilesModule } from './teacher_profiles/teacher_profiles.module';
import { EmailModule } from './email/email.module';
import { StaffModule } from './staff/staff.module';
import { SchoolConfigModule } from './config/config.module';
import { HostelModule } from './hostels/hostel.module';
import { TransportModule } from './transport/transport.module';
import { ScholarshipsModule } from './scholarships/scholarships.module';


@Module({
  imports: [
    UserModule,
    SchoolsModule,
    TeacherModule,
    SchoolTypeModule,
    ParentModule,
    StudentModule,
    GradeModule,
    SubjectModule,
    AuthModule,
    OrganizationsModule,
    TenantsModule,
    LevelModule,
    SchoolLevelSettingModule,
    CurriculumModule,
    StreamsModule,
    UserTenantMembershipModule,
    InvitationModule,
    TeacherProfilesModule,
    EmailModule,
    StaffModule,
    TeacherModule,
    ParentModule,
    SchoolConfigModule,
    HostelModule,
    TransportModule,
    ScholarshipsModule
  ],
})
export class AdminModule {}

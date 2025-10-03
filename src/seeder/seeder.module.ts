import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Curriculum } from 'src/admin/curriculum/entities/curicula.entity';
import { CurriculumSubject } from 'src/admin/curriculum/entities/curriculum_subjects.entity';
import { Grade } from 'src/admin/grade/entities/grade.entity';
import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';
import { Level } from 'src/admin/level/entities/level.entities';
import { Organization } from 'src/admin/organizations/entities/organizations-entity';
import { Parent } from 'src/admin/parent/entities/parent.entity';
import { SchoolLevelSetting } from 'src/admin/school-level-setting/entities/school-level-setting.entity';
import { SchoolType } from 'src/admin/school-type/entities/school-type';
import { SeedingService } from 'src/admin/school-type/seeds/school-type';
import { School } from 'src/admin/school/entities/school.entity';
import { Student } from 'src/admin/student/entities/student.entity';
import { Subject } from 'src/admin/subject/entities/subject.entity';
import { Teacher } from 'src/admin/teacher/entities/teacher.entity';
import { User } from 'src/admin/users/entities/user.entity';
    import { join } from 'path';
import appConfig from 'src/admin/config/app.config';
import databaseConfig from 'src/admin/config/database.config';
import resendConfig from 'src/admin/email/config/resend.config';
import environmentValidation from 'src/admin/config/environment.validation';
import { SchoolLevel } from 'src/admin/school-type/entities/school_level.entity';
import { UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { UserInvitation } from 'src/admin/invitation/entities/user-iInvitation.entity';
import { Test } from 'src/teacher/test/entities/test.entity';
import { Question } from 'src/teacher/test/entities/question.entity';
import { Option } from 'src/teacher/test/entities/option.entity';
import { ReferenceMaterial } from 'src/teacher/test/entities/reference-material.entity';
import { Stream } from 'src/admin/streams/entities/streams.entity';
import { ParentStudent } from 'src/admin/parent/entities/parent-student.entity';
import { TenantSubject } from 'src/admin/school-type/entities/tenant-specific-subject';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';
import { CustomSubject } from 'src/admin/subject/entities/cusotm-subject.entity';
import { TenantStream } from 'src/admin/school-type/entities/tenant-stream';
import { AssessmentMark } from 'src/teacher/marksheet/entities/assessment_marks-entity';
import { Mark } from 'src/teacher/marksheet/entities/marksheet-entity';
import { Assessment } from 'src/teacher/marksheet/assessment/entity/assessment.entity';
import { ClassTeacherAssignment } from 'src/admin/teacher/entities/class_teacher_assignments.entity';
import { Hostel } from 'src/admin/hostels/entities/hostel.entity';
import { HostelAssignment } from 'src/admin/hostels/entities/hostel.assignment';
import { Scholarship } from 'src/admin/scholarships/entities/scholarship.entity';
import { StudentScholarship } from 'src/admin/scholarships/entities/scholarship_assignments.entity';
import { TransportAssignment } from 'src/admin/transport/entities/transport_assignment.entity';
import { TransportRoute } from 'src/admin/transport/entities/transport_routes.entity';



const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: !ENV ? '.env.development' : `.env.${ENV}`,
      load: [appConfig, databaseConfig, resendConfig],
      validationSchema: environmentValidation,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        autoLoadEntities: configService.get('database.autoLoadEntities'),
        synchronize: configService.get('database.synchronize'),
        port: +configService.get('database.port'),
        username: configService.get('database.user'),
        password: configService.get('database.password'),
        host: configService.get('database.host'),
        database: configService.get('database.name'),
        ssl: { rejectUnauthorized: false },
      }),
    }),

    TypeOrmModule.forFeature([
      SchoolType,
      Curriculum,
      Level,
      GradeLevel,
      Subject,
      CurriculumSubject,

      Grade,
      School,
      Student,
      Teacher,
      User,
      Organization,
      Parent,
      SchoolLevelSetting,
      SchoolLevel,
      UserTenantMembership,
      Tenant,
      UserInvitation,
      Test,
      Question,
      Option,
      ReferenceMaterial,
      Stream,
      ParentStudent,
      TenantSubject,
      TenantGradeLevel,
      CustomSubject,
      TenantStream,
      Mark,

      AssessmentMark,
      Assessment,
      ClassTeacherAssignment,
      Hostel,

      HostelAssignment,
      Scholarship,
      StudentScholarship,
      TransportAssignment,
      TransportRoute

      
    ]),
  ],
  providers: [SeedingService],
  exports: [SeedingService],
})
export class SeederModule {}

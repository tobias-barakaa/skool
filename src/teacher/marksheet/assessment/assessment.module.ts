import { Module } from '@nestjs/common';
import { AssessmentProviders } from './providers/assessment-providers';
import { AssessmentResolver } from './assessment.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assessment } from './entity/assessment.entity';
import { AssessmentService } from './providers/assessment.service';
import { AssessmentCreateProvider } from './providers/assessment.create.provider';
import { UserTenantMembershipModule } from 'src/admin/user-tenant-membership/user-tenant-membership.module';
import { AssessmentCacheProvider } from './providers/assessment-cache.provider';
import { TenantValidationServiceProvider } from './providers/tenant-validation-provider';
import { LevelModule } from 'src/admin/level/level.module';
import { CurriculumModule } from 'src/admin/curriculum/curriculum.module';
import { SchoolTypeModule } from 'src/admin/school-type/school-type.module';
import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';
import { CurriculumSubject } from 'src/admin/curriculum/entities/curriculum_subjects.entity';
import { SchoolConfig } from 'src/admin/school-type/entities/school-config.entity';

@Module({
  providers: [
    AssessmentCreateProvider,
    AssessmentResolver,
    AssessmentService,
    AssessmentCacheProvider,
    TenantValidationServiceProvider,
    LevelModule,
    CurriculumModule,
    SchoolTypeModule,
    AssessmentCacheProvider,
  ],
  imports: [
    TypeOrmModule.forFeature([
      Assessment,
      GradeLevel,
      CurriculumSubject,
      SchoolConfig,
    ]),
    UserTenantMembershipModule,
    SchoolTypeModule
  ],
})
export class AssessmentModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurriculumModule } from 'src/admin/curriculum/curriculum.module';
import { CBCSchoolSelectionEntity } from './entities/cbc_school_selections';
import { SchoolConfig } from './entities/school-config.entity';
import { SchoolType } from './entities/school-type';
import { SchoolLevel } from './entities/school_level.entity';
import { UserSchoolSelection } from './entities/user.school-selection.entity';
// import { SchoolTypeResolver } from './resolvers/school-type.resolver';
// import { SchoolConfigurationService } from './services/school-type.service';
import { GradeLevel } from '../level/entities/grade-level.entity';
import { Level } from '../level/entities/level.entities';
import { SchoolsModule } from '../school/school.module';
import { SubjectModule } from '../subject/subject.module';
import { TenantsModule } from '../tenants/tenants.module';
import { SchoolConfigGradeLevel } from './entities/school_config_grade_level';
import { SchoolConfigLevel } from './entities/school_config_level';
import { SchoolConfigSubject } from './entities/school_config_subject';
import { SchoolConfigProvider } from './providers/school-config.provider';
import { SchoolConfigResolver } from './resolvers/school-config.resolver';
import { SchoolConfigService } from './services/school-config.service';
import { CommonModule } from 'src/common/common.module';
import { SchoolConfigCurriculum } from './entities/curriculum_config';
import { TenantSubject } from './entities/tenant-specific-subject';
import { TenantStream } from './entities/tenant-stream';
import { TenantGradeLevel } from './entities/tenant-grade-level';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CBCSchoolSelectionEntity,
      SchoolConfigCurriculum,
      SchoolType,
      GradeLevel,
      Level,
      UserSchoolSelection,
      SchoolLevel,
      SchoolConfig,
      SchoolConfigGradeLevel,
      SchoolConfigSubject,
      SchoolConfigLevel,
      CommonModule,
      TenantSubject,
      TenantStream,
      TenantGradeLevel
    ]),
    SubjectModule,
    CurriculumModule,
    SchoolsModule,
    TenantsModule,
  ],
  providers: [SchoolConfigService, SchoolConfigResolver, SchoolConfigProvider],
  exports: [SchoolConfigService, TypeOrmModule],
})
export class SchoolTypeModule {}

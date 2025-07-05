import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurriculumModule } from 'src/admin/curriculum/curriculum.module';
import { CBCSchoolSelectionEntity } from './entities/cbc_school_selections';
import { SchoolConfig } from './entities/school-config.entity';
import { SchoolType } from './entities/school-type';
import { SchoolLevel } from './entities/school_level.entity';
import { UserSchoolSelection } from './entities/user.school-selection.entity';
import { SchoolTypeResolver } from './resolvers/school-type.resolver';
import { SchoolTypeService } from './services/school-type.service';
import { GradeLevel } from '../level/entities/grade-level.entity';
import { Level } from '../level/entities/level.entities';
import { SubjectModule } from '../subject/subject.module';
import { SchoolsModule } from '../school/school.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CBCSchoolSelectionEntity,
      SchoolType,
      GradeLevel,
      Level,
      UserSchoolSelection,
      SchoolLevel,
      SchoolConfig,
    ]),
    SubjectModule,
    CurriculumModule,
    SchoolsModule,
    TenantsModule,
  ],
  providers: [SchoolTypeService, SchoolTypeResolver],
  exports: [SchoolTypeService, TypeOrmModule],
})
export class SchoolTypeModule {}

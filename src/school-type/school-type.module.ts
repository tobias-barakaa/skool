import { Module } from '@nestjs/common';
import { SchoolTypeProvider } from './providers/school-type-provider';
import { CbcProvider } from './providers/cbc-provider';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CBCSchoolSelectionEntity } from './entities/cbc_school_selections';
import { SubjectModule } from 'src/subject/subject.module';
import { SchoolsModule } from 'src/school/school.module';
import { SchoolType } from './entities/school-type';
import { SchoolTypeService } from './services/school-type.service';
import { CurriculumModule } from 'src/curriculum/curriculum.module';
import { UserSchoolSelection } from './entities/user.school-selection.entity';
import { GradeLevel } from 'src/level/entities/grade-level.entity';
import { SchoolTypeResolver } from './resolvers/school-type.resolver';
import { SchoolLevel } from './entities/school_level.entity';
import { SchoolConfig } from './entities/school-config.entity';
import { Level } from 'src/level/entities/level.entities';

@Module({
  imports: [TypeOrmModule.forFeature([CBCSchoolSelectionEntity, SchoolType,GradeLevel, Level,UserSchoolSelection, SchoolLevel,SchoolConfig ]), SubjectModule,CurriculumModule, SchoolsModule],
  providers: [SchoolTypeProvider, CbcProvider, SchoolTypeService, SchoolTypeResolver],
  exports: [SchoolTypeService]
})
export class SchoolTypeModule {}



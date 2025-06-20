import { Module } from '@nestjs/common';
import { SchoolTypeService } from './services/school-type.service';
import { SchoolTypeResolver } from './resolvers/school-type.resolver';
import { SchoolTypeProvider } from './providers/school-type-provider';
import { CbcProvider } from './providers/cbc-provider';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CBCSchoolSelectionEntity } from './entities/cbc_school_selections';
import { Subject } from 'src/subject/entities/subject.entity';
import { SubjectModule } from 'src/subject/subject.module';
import { SchoolSetup } from './entities/school-setup.entity';
import { SubjectService } from './services/cbc.service';
import { SchoolsModule } from 'src/school/school.module';
import { SubjectResolver } from './resolvers/cbc-setup.resolver';
import { SchoolType } from './entities/school-type';

@Module({
  imports: [TypeOrmModule.forFeature([CBCSchoolSelectionEntity, SchoolSetup, SchoolType]), SubjectModule, SchoolsModule],
  providers: [SchoolTypeService, SubjectService, SchoolTypeResolver, SubjectResolver,SchoolTypeProvider, CbcProvider],
  exports: [SchoolTypeService, SubjectService]
})
export class SchoolTypeModule {}

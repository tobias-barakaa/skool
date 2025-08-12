import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subject } from './entities/subject.entity';
import { UserSubjectSelection } from './entities/user.subject_selection.entity';
import { CreateTenantSubjectProvider } from './providers/create-tenant-subject.provider';
import { CreateTenantSubjectService } from './providers/services/create-tenant-subject.service';
import { TenantSubjectResolver } from './resolvers/tenant-subject.resolver';
import { CustomSubject } from './entities/cusotm-subject.entity';
import { SchoolTypeModule } from '../school-type/school-type.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subject, UserSubjectSelection, CustomSubject]),
    SchoolTypeModule,
  ],
  providers: [
    CreateTenantSubjectProvider,
    CreateTenantSubjectService,
    TenantSubjectResolver,

  ],
  exports: [
    TypeOrmModule,

    CreateTenantSubjectProvider,
    CreateTenantSubjectService,
  ],
})
export class SubjectModule {}

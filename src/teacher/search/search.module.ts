import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from 'src/admin/student/entities/student.entity';
import { Teacher } from 'src/admin/teacher/entities/teacher.entity';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';
import { TenantSubject } from 'src/admin/school-type/entities/tenant-specific-subject';
import { SearchProvider } from './providers/search.provider';
import { SearchService } from './search.service';
import { SearchResolver } from './search.resolver';
import { StudentModule } from 'src/admin/student/student.module';
import { StreamsModule } from 'src/admin/streams/streams.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      Teacher,
      TenantGradeLevel,
      TenantSubject,
    ]),
    StudentModule,
  StreamsModule
 ],
  providers: [SearchProvider, SearchService, SearchResolver],
  exports: [SearchService],
})
export class SearchModule {}

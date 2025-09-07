import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScholarshipsService } from './scholarships.service';
import { ScholarshipsResolver } from './scholarships.resolver';
import { Scholarship } from './entities/scholarship.entity';
import { StudentScholarship } from './entities/scholarship_assignments.entity';
import { StudentModule } from '../student/student.module';

@Module({
  imports: [TypeOrmModule.forFeature([Scholarship, StudentScholarship]),StudentModule],
  providers: [ScholarshipsService, ScholarshipsResolver],
  exports: [ScholarshipsService],
})
export class ScholarshipsModule {}

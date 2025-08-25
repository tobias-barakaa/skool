import { Module } from '@nestjs/common';
import { AssessmentModule } from './assessment/assessment.module';
import { MarkProvider } from './providers/marksheet-provider';
import { MarkService } from './providers/marksheet-service';
import { Mark } from './entities/marksheet-entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from 'src/admin/student/entities/student.entity';
import { MarkResolver } from './marksheet-resolver';
import { AssessmentMark } from './entities/assessment_marks-entity';

@Module({
  providers: [MarkProvider, MarkService, MarkResolver],
  imports: [TypeOrmModule.forFeature([Mark, Student, AssessmentMark]), AssessmentModule],
})
export class MarksheetModule {}

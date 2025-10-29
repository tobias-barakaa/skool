import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentMark } from 'src/teacher/marksheet/entities/assessment_marks-entity';
import { Student } from 'src/admin/student/entities/student.entity';
import { Assessment } from 'src/teacher/marksheet/assessment/entity/assessment.entity';
import { StudentMarksheetService } from './services/student-marksheet.service';
import { StudentMarksheetResolver } from './resolver/student-marksheet.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssessmentMark,
      Student,
      Assessment,
    ]),
  ],
  providers: [StudentMarksheetService, StudentMarksheetResolver],
  exports: [StudentMarksheetService],
})
export class StudentMarksheetModule {}
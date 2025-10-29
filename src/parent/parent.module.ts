// parent-portal.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentFeeAssignment } from 'src/admin/finance/fee-assignment/entities/student_fee_assignments.entity';
import { StudentFeeItem } from 'src/admin/finance/fee-assignment/entities/student_fee_items.entity';
import { Payment } from 'src/admin/finance/payment/entities/payment.entity';
import { ParentStudent } from 'src/admin/parent/entities/parent-student.entity';
import { Parent } from 'src/admin/parent/entities/parent.entity';
import { Student } from 'src/admin/student/entities/student.entity';
import { Attendance } from 'src/teacher/attendance/entities/attendance.entity';
import { AssessmentMark } from 'src/teacher/marksheet/entities/assessment_marks-entity';
import { ParentPortalService } from './services/parent-portal.service';
import { ParentPortalResolver } from './resolvers/parent-portal.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Parent,
      ParentStudent,
      Student,
      Attendance,
      StudentFeeAssignment,
      StudentFeeItem,
      Payment,
      AssessmentMark,
    ]),
  ],
  providers: [ParentPortalService, ParentPortalResolver],
  exports: [ParentPortalService],
})
export class ParentModule {}
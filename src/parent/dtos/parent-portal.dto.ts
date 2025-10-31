// parent-portal.dto.ts
import { Field, ID, ObjectType, Float, Int, InputType } from '@nestjs/graphql';
import { Invoice } from 'src/admin/finance/invoice/entities/invoice.entity';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';
import { TenantStream } from 'src/admin/school-type/entities/tenant-stream';
import { Teacher } from 'src/admin/teacher/entities/teacher.entity';
import { User } from 'src/admin/users/entities/user.entity';
import { AttendanceStatus } from 'src/teacher/attendance/entities/attendance.entity';

// Child Profile DTO
@ObjectType()
export class ChildProfileDto {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  admissionNumber: string;

  @Field()
  phone: string;

  @Field()
  gender: string;

  @Field(() => TenantGradeLevel)
  grade: TenantGradeLevel;

  @Field(() => TenantStream, { nullable: true })
  stream?: TenantStream;

  @Field({ nullable: true })
  schoolType?: string;

  @Field(() => Float)
  feesOwed: number;

  @Field(() => Float)
  totalFeesPaid: number;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;
}

// My Children DTO
@ObjectType()
export class MyChildDto {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  admissionNumber: string;

  @Field(() => TenantGradeLevel)
  grade: TenantGradeLevel;

  @Field()
  relationship: string;

  @Field()
  isPrimary: boolean;

  @Field()
  phone: string;

  @Field()
  gender: string;

  @Field()
  isActive: boolean;
}

// Attendance Summary DTO
@ObjectType()
export class AttendanceSummaryDto {
  @Field(() => Int)
  totalDays: number;

  @Field(() => Int)
  present: number;

  @Field(() => Int)
  absent: number;

  @Field(() => Int)
  late: number;

  @Field(() => Int)
  suspended: number;

  @Field()
  attendanceRate: string;
}

// Attendance Detail DTO
@ObjectType()
export class AttendanceDetailDto {
  @Field(() => ID)
  id: string;

  @Field()
  date: string;

  @Field(() => AttendanceStatus)
  status: AttendanceStatus;

  @Field(() => Teacher)
  teacher: Teacher;

  @Field()
  createdAt: Date;
}


// Fee Item Breakdown DTO
@ObjectType()
export class FeeItemBreakdownDto {
  @Field(() => ID)
  id: string;

  @Field()
  bucketName: string;

  @Field({ nullable: true })
  itemName?: string;

  @Field(() => Float)
  amount: number;

  @Field(() => Float)
  amountPaid: number;

  @Field(() => Float)
  balance: number;

  @Field()
  isMandatory: boolean;
}

// Fee Balance DTO
@ObjectType()
export class FeeBalanceDto {
  @Field(() => ID)
  studentId: string;

  @Field(() => Float)
  totalDue: number;

  @Field(() => Float)
  totalPaid: number;

  @Field(() => Float)
  feesOwed: number;

  @Field(() => [FeeItemBreakdownDto])
  items: FeeItemBreakdownDto[];
}

// Payment History DTO
@ObjectType()
export class PaymentHistoryDto {
  @Field(() => ID)
  id: string;

  @Field()
  receiptNumber: string;

  @Field(() => Float)
  amount: number;

  @Field({ nullable: true })
  paymentMethod?: string;

  @Field({ nullable: true })
  transactionReference?: string;

  @Field()
  paymentDate: Date;

  @Field(() => User)
  receivedByUser: User;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => Invoice)
  invoice: Invoice;

  @Field()
  createdAt: Date;
}

// Performance Mark DTO
@ObjectType()
export class PerformanceMarkDto {
  @Field(() => ID)
  id: string;

  @Field(() => Float)
  score: number;

  @Field(() => Float)
  maxScore: number;

  @Field()
  assessmentType: string;

  @Field(() => Int)
  term: number;

  @Field()
  academicYear: string;

  @Field()
  date: Date;
}

// Subject Performance DTO
@ObjectType()
export class SubjectPerformanceDto {
  @Field(() => ID)
  subjectId: string;

  @Field()
  subjectName: string;

  @Field(() => [PerformanceMarkDto])
  marks: PerformanceMarkDto[];

  @Field(() => Float)
  average: number;
}

// Report Card Subject Score DTO
@ObjectType()
export class ReportCardSubjectScoreDto {
  @Field()
  type: string;

  @Field(() => Float)
  score: number;

  @Field(() => Float)
  maxScore: number;
}

// Report Card Subject DTO
@ObjectType()
export class ReportCardSubjectDto {
  @Field()
  subject: string;

  @Field(() => [ReportCardSubjectScoreDto])
  scores: ReportCardSubjectScoreDto[];

  @Field(() => Float)
  total: number;

  @Field(() => Float)
  average: number;
}

// Report Card Student Info DTO
@ObjectType()
export class ReportCardStudentInfoDto {
  @Field()
  name: string;

  @Field()
  admissionNumber: string;

  @Field()
  grade: string;

  @Field({ nullable: true })
  stream?: string;
}

// Report Card DTO
@ObjectType()
export class ReportCardDto {
  @Field(() => ReportCardStudentInfoDto)
  student: ReportCardStudentInfoDto;

  @Field(() => Int)
  term: number;

  @Field()
  academicYear: string;

  @Field(() => [ReportCardSubjectDto])
  subjects: ReportCardSubjectDto[];

  @Field(() => Float)
  overallAverage: number;

  @Field(() => Int)
  totalSubjects: number;
}

// Input Types
@InputType()
export class GetAttendanceInput {
  @Field(() => ID)
  studentId: string;

  @Field()
  startDate: string;

  @Field()
  endDate: string;
}

@InputType()
export class GetPerformanceInput {
  @Field(() => ID)
  studentId: string;

  @Field(() => Int, { nullable: true })
  term?: number;

  @Field({ nullable: true })
  academicYear?: string;
}

@InputType()
export class GetReportCardInput {
  @Field(() => ID)
  studentId: string;

  @Field(() => Int)
  term: number;

  @Field()
  academicYear: string;
}
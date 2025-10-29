// import { ObjectType, Field, ID, Float, Int, InputType } from '@nestjs/graphql';
// import { Student } from 'src/admin/student/entities/student.entity';
// import { User } from 'src/admin/users/entities/user.entity';
// import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';

// // ============================================
// // Child Profile DTOs
// // ============================================

// @ObjectType()
// export class ClassTeacherDto {
//   @Field(() => ID)
//   id: string;

//   @Field()
//   name: string;

//   @Field({ nullable: true })
//   email?: string;

//   @Field({ nullable: true })
//   phone?: string;
// }

// @ObjectType()
// export class ChildProfileDto {
//   @Field(() => ID)
//   id: string;

//   @Field()
//   name: string;

//   @Field()
//   admissionNumber: string;

//   @Field({ nullable: true })
//   photo?: string;

//   @Field()
//   grade: string;

//   @Field({ nullable: true })
//   stream?: string;

//   @Field({ nullable: true })
//   className?: string;

//   @Field(() => ClassTeacherDto, { nullable: true })
//   classTeacher?: ClassTeacherDto;

//   @Field()
//   gender: string;

//   @Field()
//   phone: string;

//   @Field()
//   isActive: boolean;

//   @Field()
//   relationship: string;

//   @Field()
//   isPrimaryGuardian: boolean;
// }

// @ObjectType()
// export class ParentChildrenDto {
//   @Field(() => [ChildProfileDto])
//   children: ChildProfileDto[];

//   @Field(() => Int)
//   totalChildren: number;
// }

// // ============================================
// // Fees DTOs
// // ============================================

// @ObjectType()
// export class FeeItemDto {
//   @Field(() => ID)
//   id: string;

//   @Field()
//   name: string;

//   @Field()
//   category: string;

//   @Field(() => Float)
//   amount: number;

//   @Field(() => Float)
//   amountPaid: number;

//   @Field(() => Float)
//   balance: number;

//   @Field()
//   isMandatory: boolean;

//   @Field()
//   isActive: boolean;
// }

// @ObjectType()
// export class FeesSummaryDto {
//   @Field(() => ID)
//   studentId: string;

//   @Field()
//   studentName: string;

//   @Field()
//   admissionNumber: string;

//   @Field(() => Float)
//   totalFees: number;

//   @Field(() => Float)
//   totalPaid: number;

//   @Field(() => Float)
//   balance: number;

//   @Field(() => [FeeItemDto])
//   feeItems: FeeItemDto[];

//   @Field(() => Int)
//   totalInvoices: number;

//   @Field(() => Int)
//   paidInvoices: number;

//   @Field(() => Int)
//   pendingInvoices: number;
// }

// @ObjectType()
// export class PaymentHistoryDto {
//   @Field(() => ID)
//   id: string;

//   @Field()
//   receiptNumber: string;

//   @Field(() => Float)
//   amount: number;

//   @Field()
//   paymentMethod: string;

//   @Field({ nullable: true })
//   transactionReference?: string;

//   @Field(() => Date)
//   paymentDate: Date;

//   @Field()
//   receivedByName: string;

//   @Field({ nullable: true })
//   notes?: string;
// }

// @ObjectType()
// export class ChildFeesDto {
//   @Field(() => FeesSummaryDto)
//   summary: FeesSummaryDto;

//   @Field(() => [PaymentHistoryDto])
//   paymentHistory: PaymentHistoryDto[];
// }

// // ============================================
// // Attendance DTOs
// // ============================================

// @ObjectType()
// export class DailyAttendanceDto {
//   @Field(() => ID)
//   id: string;

//   @Field()
//   date: string;

//   @Field(() => AttendanceStatus)
//   status: AttendanceStatus;

//   @Field({ nullable: true })
//   remarks?: string;

//   @Field()
//   markedByTeacher: string;
// }

// @ObjectType()
// export class AttendanceSummaryDto {
//   @Field(() => Int)
//   totalDays: number;

//   @Field(() => Int)
//   presentDays: number;

//   @Field(() => Int)
//   absentDays: number;

//   @Field(() => Int)
//   lateDays: number;

//   @Field(() => Int)
//   suspendedDays: number;

//   @Field(() => Float)
//   attendancePercentage: number;
// }

// @ObjectType()
// export class MonthlyAttendanceDto {
//   @Field()
//   month: string;

//   @Field(() => Int)
//   year: number;

//   @Field(() => AttendanceSummaryDto)
//   summary: AttendanceSummaryDto;

//   @Field(() => [DailyAttendanceDto])
//   dailyRecords: DailyAttendanceDto[];
// }

// @ObjectType()
// export class AttendanceTrendDto {
//   @Field()
//   period: string; // e.g., "Week 1", "January"

//   @Field(() => Int)
//   present: number;

//   @Field(() => Int)
//   absent: number;

//   @Field(() => Int)
//   late: number;

//   @Field(() => Float)
//   attendanceRate: number;
// }

// @ObjectType()
// export class ChildAttendanceDto {
//   @Field(() => ID)
//   studentId: string;

//   @Field()
//   studentName: string;

//   @Field(() => AttendanceSummaryDto)
//   overallSummary: AttendanceSummaryDto;

//   @Field(() => [MonthlyAttendanceDto])
//   monthlyBreakdown: MonthlyAttendanceDto[];

//   @Field(() => [AttendanceTrendDto])
//   trends: AttendanceTrendDto[];
// }

// // ============================================
// // Academic Performance DTOs
// // ============================================

// @ObjectType()
// export class SubjectPerformanceDto {
//   @Field(() => ID)
//   subjectId: string;

//   @Field()
//   subjectName: string;

//   @Field(() => Float, { nullable: true })
//   currentScore?: number;

//   @Field(() => Float, { nullable: true })
//   maxScore?: number;

//   @Field(() => Float, { nullable: true })
//   percentage?: number;

//   @Field({ nullable: true })
//   grade?: string;

//   @Field({ nullable: true })
//   remarks?: string;

//   @Field()
//   teacherName: string;
// }

// @ObjectType()
// export class TermPerformanceDto {
//   @Field(() => Int)
//   term: number;

//   @Field()
//   termName: string;

//   @Field(() => [SubjectPerformanceDto])
//   subjects: SubjectPerformanceDto[];

//   @Field(() => Float, { nullable: true })
//   termAverage?: number;

//   @Field({ nullable: true })
//   overallGrade?: string;

//   @Field({ nullable: true })
//   position?: string;

//   @Field({ nullable: true })
//   classTeacherComment?: string;
// }

// @ObjectType()
// export class AcademicYearPerformanceDto {
//   @Field()
//   academicYear: string;

//   @Field()
//   grade: string;

//   @Field(() => [TermPerformanceDto])
//   terms: TermPerformanceDto[];

//   @Field(() => Float, { nullable: true })
//   yearAverage?: number;

//   @Field({ nullable: true })
//   overallPosition?: string;
// }

// @ObjectType()
// export class ChildAcademicPerformanceDto {
//   @Field(() => ID)
//   studentId: string;

//   @Field()
//   studentName: string;

//   @Field(() => [AcademicYearPerformanceDto])
//   academicYears: AcademicYearPerformanceDto[];
// }

// // ============================================
// // Report Card DTOs
// // ============================================

// @ObjectType()
// export class ReportCardSubjectDto {
//   @Field()
//   subjectName: string;

//   @Field(() => Float)
//   score: number;

//   @Field(() => Float)
//   maxScore: number;

//   @Field()
//   grade: string;

//   @Field()
//   remarks: string;

//   @Field()
//   teacherName: string;
// }

// @ObjectType()
// export class ReportCardDto {
//   @Field(() => ID)
//   id: string;

//   @Field()
//   studentName: string;

//   @Field()
//   admissionNumber: string;

//   @Field()
//   grade: string;

//   @Field({ nullable: true })
//   stream?: string;

//   @Field()
//   term: string;

//   @Field()
//   academicYear: string;

//   @Field(() => [ReportCardSubjectDto])
//   subjects: ReportCardSubjectDto[];

//   @Field(() => Float)
//   totalMarks: number;

//   @Field(() => Float)
//   averageMarks: number;

//   @Field()
//   overallGrade: string;

//   @Field({ nullable: true })
//   position?: string;

//   @Field({ nullable: true })
//   classTeacherComment?: string;

//   @Field({ nullable: true })
//   principalComment?: string;

//   @Field(() => AttendanceSummaryDto)
//   attendanceSummary: AttendanceSummaryDto;

//   @Field(() => Date)
//   generatedDate: Date;
// }

// // ============================================
// // Input Types
// // ============================================

// @InputType()
// export class GetChildAttendanceInput {
//   @Field(() => ID)
//   studentId: string;

//   @Field({ nullable: true })
//   startDate?: string;

//   @Field({ nullable: true })
//   endDate?: string;

//   @Field({ nullable: true })
//   month?: string;

//   @Field({ nullable: true })
//   year?: string;
// }

// @InputType()
// export class GetChildPerformanceInput {
//   @Field(() => ID)
//   studentId: string;

//   @Field({ nullable: true })
//   academicYear?: string;

//   @Field(() => Int, { nullable: true })
//   term?: number;
// }

// @InputType()
// export class GetReportCardInput {
//   @Field(() => ID)
//   studentId: string;

//   @Field()
//   academicYear: string;

//   @Field(() => Int)
//   term: number;
// }

// // ============================================
// // Dashboard Overview DTO
// // ============================================

// @ObjectType()
// export class ParentDashboardDto {
//   @Field(() => [ChildProfileDto])
//   children: ChildProfileDto[];

//   @Field(() => [AttendanceSummaryDto])
//   childrenAttendanceSummary: AttendanceSummaryDto[];

//   @Field(() => [FeesSummaryDto])
//   childrenFeesSummary: FeesSummaryDto[];

//   @Field(() => Float)
//   totalOutstandingFees: number;

//   @Field(() => Int)
//   totalPendingInvoices: number;
// }
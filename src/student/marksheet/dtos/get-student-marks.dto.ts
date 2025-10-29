import { InputType, ObjectType, Field, Float, Int, ID } from '@nestjs/graphql';
import {
  IsOptional,
  IsString,
  IsInt,
  IsUUID,
  Min,
  Max,
  IsNumber,
  IsBoolean,
  IsDate,
  Length,
} from 'class-validator';

// ============================================================
// INPUT TYPE
// ============================================================

@InputType()
export class GetStudentMarksFilterDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(4, 9) // e.g., "2024/2025"
  academicYear?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  term?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  tenantSubjectId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  assessmentType?: string; // e.g., "CA", "EXAM"
}

// ============================================================
// OBJECT TYPES
// ============================================================

@ObjectType()
export class StudentMarkDetail {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field(() => Float)
  @IsNumber()
  score: number;

  @Field(() => Float)
  @IsNumber()
  maxScore: number;

  @Field(() => Float)
  @IsNumber()
  percentage: number;

  @Field()
  @IsString()
  title: string;

  @Field()
  @IsString()
  type: string;

  @Field()
  @IsString()
  subject: string;

  @Field()
  @IsString()
  gradeLevel: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  cutoff?: number;

  @Field()
  @IsString()
  status: string;

  @Field(() => Int)
  @IsInt()
  term: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  academicYear?: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  date?: Date;

  @Field()
  @IsBoolean()
  isPassed: boolean;

  @Field()
  @IsDate()
  createdAt: Date;
}

@ObjectType()
export class SubjectPerformance {
  @Field(() => ID)
  @IsUUID()
  subjectId: string;

  @Field()
  @IsString()
  subjectName: string;

  @Field(() => Float)
  @IsNumber()
  totalScore: number;

  @Field(() => Float)
  @IsNumber()
  maxPossibleScore: number;

  @Field(() => Float)
  @IsNumber()
  percentage: number;

  @Field(() => Float)
  @IsNumber()
  average: number;

  @Field(() => Int)
  @IsInt()
  assessmentsCount: number;

  @Field()
  @IsString()
  grade: string;

  @Field(() => [StudentMarkDetail])
  marks: StudentMarkDetail[];
}

@ObjectType()
export class TermPerformance {
  @Field(() => Int)
  @IsInt()
  term: number;

  @Field()
  @IsString()
  academicYear: string;

  @Field(() => Float)
  @IsNumber()
  totalScore: number;

  @Field(() => Float)
  @IsNumber()
  maxPossibleScore: number;

  @Field(() => Float)
  @IsNumber()
  percentage: number;

  @Field(() => Float)
  @IsNumber()
  average: number;

  @Field()
  @IsString()
  grade: string;

  @Field(() => Int)
  @IsInt()
  totalAssessments: number;

  @Field(() => Int)
  @IsInt()
  passedAssessments: number;

  @Field(() => Int)
  @IsInt()
  failedAssessments: number;

  @Field(() => [SubjectPerformance])
  subjects: SubjectPerformance[];
}

@ObjectType()
export class StudentReportCard {
  @Field(() => ID)
  @IsUUID()
  studentId: string;

  @Field()
  @IsString()
  studentName: string;

  @Field()
  @IsString()
  admissionNumber: string;

  @Field()
  @IsString()
  gradeLevel: string;

  @Field(() => Float)
  @IsNumber()
  overallAverage: number;

  @Field()
  @IsString()
  overallGrade: string;

  @Field(() => Int)
  @IsInt()
  totalAssessments: number;

  @Field(() => [TermPerformance])
  termPerformances: TermPerformance[];

  @Field(() => [SubjectPerformance])
  allSubjects: SubjectPerformance[];
}

@ObjectType()
export class StudentRanking {
  @Field(() => Int)
  @IsInt()
  rank: number;

  @Field(() => Int)
  @IsInt()
  totalStudents: number;

  @Field(() => Float)
  @IsNumber()
  studentAverage: number;

  @Field(() => Float)
  @IsNumber()
  classAverage: number;

  @Field(() => Float)
  @IsNumber()
  topScore: number;

  @Field()
  @IsString()
  percentile: string;
}


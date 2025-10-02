import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';



@ObjectType()
export class FeeItemSummary {
  @Field(() => ID)
  id: string;

  @Field()
  feeBucketName: string;

  @Field(() => Float)
  amount: number;

  @Field()
  isMandatory: boolean;

  @Field()
  feeStructureName: string;

  @Field()
  academicYearName: string;

  @Field()
  termName: string;
}

@ObjectType()
export class StudentFeeSummarys {
  @Field(() => Float)
  totalOwed: number;

  @Field(() => Float)
  totalPaid: number;

  @Field(() => Float)
  balance: number;

  @Field(() => Int)
  numberOfFeeItems: number;

  @Field(() => [FeeItemSummary])
  feeItems: FeeItemSummary[];
}

@ObjectType()
export class StudentSummary {
  @Field(() => ID)
  id: string;

  @Field()
  admissionNumber: string;

  @Field()
  studentName: string;

  @Field()
  email: string;

  @Field()
  phone: string;

  @Field()
  gender: string;

  @Field()
  schoolType: string;

  @Field()
  gradeLevelName: string;

  @Field()
  curriculumName: string;

  @Field({ nullable: true })
  streamName?: string;

  @Field(() => StudentFeeSummarys)
  feeSummary: StudentFeeSummarys;

  @Field()
  isActive: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class GradeLevelStudentsSummary {
  @Field(() => ID)
  gradeLevelId: string;

  @Field()
  gradeLevelName: string;

  @Field()
  curriculumName: string;

  @Field(() => Int)
  totalStudents: number;

  @Field(() => Float)
  totalFeesOwed: number;

  @Field(() => Float)
  totalFeesPaid: number;

  @Field(() => Float)
  totalBalance: number;

  @Field(() => [StudentSummary])
  students: StudentSummary[];
}

import { Field, Float, ID, Int, ObjectType } from "@nestjs/graphql";
import { GradeLevelStudentsSummary } from "./student-summary.dto";

@ObjectType()
export class SchoolFinancialSummary {
  @Field(() => ID)
  tenantId: string;

  @Field(() => Int, { description: 'Total number of active students' })
  totalStudents: number;

  @Field(() => Float, { description: 'Total fees owed by all students' })
  totalFeesOwed: number;

  @Field(() => Float, { description: 'Total fees paid by all students' })
  totalFeesPaid: number;

  @Field(() => Float, { description: 'Total outstanding balance' })
  totalBalance: number;

  @Field(() => [GradeLevelStudentsSummary], { description: 'Breakdown by grade level' })
  gradeLevelSummaries: GradeLevelStudentsSummary[];
}



@ObjectType()
export class AcademicYearFinancialSummary {
  @Field(() => ID)
  tenantId: string;

  @Field(() => ID)
  academicYearId: string;

  @Field()
  academicYearName: string;

  @Field(() => Int)
  totalStudents: number;

  @Field(() => Float)
  totalFeesOwed: number;

  @Field(() => Float)
  totalFeesPaid: number;

  @Field(() => Float)
  totalBalance: number;

  @Field(() => [GradeLevelStudentsSummary])
  gradeLevelSummaries: GradeLevelStudentsSummary[];
}

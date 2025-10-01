import { ObjectType, Field, Float, Int } from '@nestjs/graphql';
import { FeeStructureSummaryByTenant } from './summary-tenant.dto';
import { FeeStructureSummaryByGradeLevel } from './summary-gradelevel.dto';
import { FeeStructureSummaryByAcademicYear } from './summary-by-academic-year.dto';
import { FeeStructureSummaryByFeeBucket } from './summary-by-fee-bucket.dto';


@ObjectType()
export class ComprehensiveFeeStructureSummary {
  @Field(() => FeeStructureSummaryByTenant)
  tenantSummary: FeeStructureSummaryByTenant;

  @Field(() => [FeeStructureSummaryByGradeLevel])
  gradeLevelSummaries: FeeStructureSummaryByGradeLevel[];

  @Field(() => [FeeStructureSummaryByAcademicYear])
  academicYearSummaries: FeeStructureSummaryByAcademicYear[];

  @Field(() => [FeeStructureSummaryByFeeBucket])
  feeBucketSummaries: FeeStructureSummaryByFeeBucket[];
}
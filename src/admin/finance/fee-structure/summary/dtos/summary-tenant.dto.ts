import { ObjectType, Field, Float, Int } from '@nestjs/graphql';


@ObjectType()
export class FeeStructureSummaryByTenant {
  @Field()
  tenantId: string;

  @Field(() => Int)
  totalFeeStructures: number;

  @Field(() => Int)
  totalGradeLevels: number;

  @Field(() => Float)
  totalMandatoryAmount: number;

  @Field(() => Float)
  totalOptionalAmount: number;

  @Field(() => Float)
  grandTotalAmount: number;

  @Field(() => Int)
  totalFeeItems: number;

  @Field(() => [String])
  uniqueAcademicYears: string[];

  @Field(() => [String])
  uniqueTerms: string[];

  @Field(() => [String])
  uniqueFeeBuckets: string[];
}

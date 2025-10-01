import { ObjectType, Field, Float, Int } from '@nestjs/graphql';


@ObjectType()
export class FeeStructureSummaryByAcademicYear {
  @Field()
  academicYearId: string;

  @Field()
  academicYearName: string;

  @Field(() => Int)
  totalFeeStructures: number;

  @Field(() => Float)
  totalAmount: number;

  @Field(() => Int)
  affectedGradeLevels: number;

  @Field(() => [String])
  terms: string[];
}
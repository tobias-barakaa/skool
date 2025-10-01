import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class FeeStructureSummaryByGradeLevel {
  @Field()
  gradeLevelId: string;

  @Field()
  gradeLevelName: string;

  @Field(() => Int)
  totalFeeStructures: number;

  @Field(() => Float)
  totalMandatoryAmount: number;

  @Field(() => Float)
  totalOptionalAmount: number;

  @Field(() => Float)
  totalAmount: number;

  @Field(() => Int)
  totalItems: number;

  @Field(() => [String])
  academicYears: string[];

  @Field(() => [String])
  terms: string[];
}
import { ObjectType, Field, Float, Int } from '@nestjs/graphql';


@ObjectType()
export class FeeStructureSummaryByFeeBucket {
  @Field()
  feeBucketId: string;

  @Field()
  feeBucketName: string;

  @Field(() => Float)
  totalAmount: number;

  @Field(() => Int)
  usageCount: number;

  @Field(() => Int)
  mandatoryCount: number;

  @Field(() => Int)
  optionalCount: number;
}
import { InputType, Field, Float, Int } from '@nestjs/graphql';

@InputType()
export class CreateHostelInput {
  @Field()
  name: string;

  @Field(() => Int)
  capacity: number;

  @Field(() => Float)
  feeAmount: number;
}

import { InputType, Field, Float, Int, PartialType } from '@nestjs/graphql';
import { CreateHostelInput } from './create-hostel.input';

@InputType()
export class UpdateHostelInput extends PartialType(CreateHostelInput) {
  @Field()
  id: string;

  @Field({ nullable: true })
  name?: string;

  @Field(() => Int, { nullable: true })
  capacity?: number;

  @Field(() => Float, { nullable: true })
  feeAmount?: number;
}

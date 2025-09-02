import { InputType, Field, Float, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsInt, IsNumber, Min } from 'class-validator';

@InputType()
export class CreateHostelInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  capacity: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  feeAmount: number;
}

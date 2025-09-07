import { InputType, Field, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsIn, IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateTransportRouteInput {
  @Field()
  @IsNotEmpty()
  name: string;

  @Field(() => Float)
  @IsNumber()
  fee: number;

  @Field({ nullable: true, description: "Custom label e.g. 'Per Semester' or 'Every 2 Weeks'" })
  @IsOptional()
  @IsString()
  billingCycleLabel?: string;
}

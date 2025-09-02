import { InputType, Field, Float } from '@nestjs/graphql';
import { IsOptional, IsString, IsNumber } from 'class-validator';

@InputType()
export class CreateScholarshipInput {
  @Field()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  amount?: number;
}

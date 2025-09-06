// create-scholarship.input.ts
import { InputType, Field, Float } from '@nestjs/graphql';
import { IsString, IsNumber, IsOptional, IsIn, Min } from 'class-validator';

@InputType()
export class CreateScholarshipInput {
  @Field()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  amount: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(['FIXED', 'PERCENTAGE'])
  type?: string; 
}

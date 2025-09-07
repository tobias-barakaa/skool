import { InputType, Field, ID, PartialType, Float } from '@nestjs/graphql';
import { CreateScholarshipInput } from './create-scholarship.input';
import { IsUUID, IsOptional, IsNumber, Min, IsString, IsIn } from 'class-validator';

@InputType()
export class UpdateScholarshipInput extends PartialType(CreateScholarshipInput) {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(['FIXED', 'PERCENTAGE'])
  type?: string;
  
}

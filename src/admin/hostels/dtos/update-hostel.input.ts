import { InputType, Field, Float, Int, PartialType, ID } from '@nestjs/graphql';
import { CreateHostelInput } from './create-hostel.input';
import { IsUUID, IsOptional, IsString, IsInt, IsNumber, Min } from 'class-validator';

@InputType()
export class UpdateHostelInput extends PartialType(CreateHostelInput) {
  @Field(() => ID)
  @IsUUID()
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  feeAmount?: number;
}

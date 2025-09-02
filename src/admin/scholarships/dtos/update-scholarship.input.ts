import { InputType, Field, ID, Float, PartialType } from '@nestjs/graphql';
import { CreateScholarshipInput } from './create-scholarship.input';
import { IsUUID } from 'class-validator';

@InputType()
export class UpdateScholarshipInput extends PartialType(CreateScholarshipInput) {
  @Field(() => ID)
  @IsUUID()
  id: string;
}

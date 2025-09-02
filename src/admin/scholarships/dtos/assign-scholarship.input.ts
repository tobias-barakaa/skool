import { Field, InputType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class AssignScholarshipInput {
  @Field()
  @IsUUID()
  studentId: string;

  @Field()
  @IsUUID()
  scholarshipId: string;
}

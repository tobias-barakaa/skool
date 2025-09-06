// assign-scholarship.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsUUID, IsString } from 'class-validator';

@InputType()
export class AssignScholarshipInput {
  @Field()
  @IsUUID()
  studentId: string;

  @Field()
  @IsUUID()
  scholarshipId: string;

  @Field()
  @IsString()
  academicYear: string;
}

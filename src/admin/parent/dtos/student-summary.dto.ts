// dtos/student-summary.dto.ts
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class StudentSummaryDto {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  admissionNumber: string;

  @Field()
  grade: string;
}

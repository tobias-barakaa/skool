// dtos/invite-parent-response.dto.ts
import { Field, ObjectType } from '@nestjs/graphql';
import { StudentSummaryDto } from './student-summary.dto';

@ObjectType()
export class InviteParentResponse {
  @Field()
  email: string;

  @Field()
  name: string;

  @Field()
  status: string;

  @Field()
  createdAt: Date;

  @Field(() => [StudentSummaryDto])
  students: StudentSummaryDto[];

  @Field({ nullable: true })
  studentAdmissionNumber?: string; 
}

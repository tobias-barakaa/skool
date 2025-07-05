// invite-teacher-response.dto.ts
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class InviteTeacherResponse {
  @Field()
  email: string;

  @Field()
  fullName: string;

  @Field()
  status: string;

  @Field()
  createdAt: Date;
}

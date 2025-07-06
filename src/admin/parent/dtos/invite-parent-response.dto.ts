import { Field, ObjectType } from '@nestjs/graphql';

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

  @Field()
  studentName: string;

  @Field()
  studentAdmissionNumber: string;
}

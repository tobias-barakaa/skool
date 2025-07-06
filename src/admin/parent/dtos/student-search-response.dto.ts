import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class StudentSearchResponse {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  admissionNumber: string;

  @Field()
  grade: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  streamId?: string;
}

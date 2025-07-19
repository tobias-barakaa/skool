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
  grade: string; // This will be manually mapped from gradeLevel.name in your service

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  streamId?: string;
}

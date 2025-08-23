// src/students/dtos/student-login-info.output.ts
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class StudentLoginInfo {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field()
  admission_number: string;

  @Field()
  grade: string; // just the grade name
}

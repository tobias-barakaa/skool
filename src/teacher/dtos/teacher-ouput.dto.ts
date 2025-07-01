// src/teachers/dtos/teacher.output.ts
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class TeacherOutput {
  @Field()
  id: string;

  @Field()
  name: string;

 
}

// src/teachers/dtos/teacher.output.ts
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class ParentOutput {
  @Field()
  id: string;

  @Field()
  name: string;


}

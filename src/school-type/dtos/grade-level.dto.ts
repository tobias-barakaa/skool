import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class GradeLevelDto {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  order: number;

  @Field()
  code: string; // 'Y1', 'Y10', 'NUR'
}
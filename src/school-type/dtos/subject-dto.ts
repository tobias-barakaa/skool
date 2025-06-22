import { Field, ObjectType } from "@nestjs/graphql";
import { SubjectType } from "src/subject/enums/subject.type.enum";

@ObjectType()
export class SubjectDto {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  code: string;

  @Field({ nullable: true })
  description: string;

  @Field(() => SubjectType)
  subjectType: SubjectType;
}
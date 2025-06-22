import { Field, ObjectType } from "@nestjs/graphql";
import { SubjectType } from "src/subject/enums/subject.type.enum";
import { SubjectDto } from "./subject-dto";

@ObjectType()
export class SubjectByCategoryDto {
  @Field(() => SubjectType)
  category: SubjectType;

  @Field(() => [SubjectDto])
  subjects: SubjectDto[];
}
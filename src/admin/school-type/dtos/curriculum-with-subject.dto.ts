import { Field, ObjectType } from "@nestjs/graphql";
import { GradeLevelDto } from "./grade-level.dto";
import { SubjectByCategoryDto } from "./subject-by-category.dto";

@ObjectType()
export class CurriculumWithSubjectsDto {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  displayName: string;

  @Field(() => [GradeLevelDto])
  gradeLevels: GradeLevelDto[];

  @Field(() => [SubjectByCategoryDto])
  subjectsByCategory: SubjectByCategoryDto[];
}
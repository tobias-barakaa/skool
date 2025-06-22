import { Field, ObjectType } from "@nestjs/graphql";
import { Curriculum } from "src/curriculum/entities/curicula.entity";
import { Subject } from "src/subject/entities/subject.entity";
import { SubjectType } from "src/subject/enums/subject.type.enum";

@ObjectType()
export class UserSubjectSelectionDto {
  @Field()
  id: string;

  @Field(() => Subject)
  subject: Subject;

  @Field(() => Curriculum)
  curriculum: Curriculum;

  @Field(() => SubjectType)
  subjectType: SubjectType;

  @Field()
  selectedAt: Date;
}
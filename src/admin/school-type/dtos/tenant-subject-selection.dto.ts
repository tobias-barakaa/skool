import { Field, ObjectType } from "@nestjs/graphql";
import { Curriculum } from "src/admin/curriculum/entities/curicula.entity";
import { Subject } from "src/admin/subject/entities/subject.entity";
import { SubjectType } from "src/admin/subject/enums/subject.type.enum";

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

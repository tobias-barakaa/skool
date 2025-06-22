import { Field, ObjectType } from "@nestjs/graphql";
import { UserSchoolSelectionDto } from "./tenant-school-selection.dto";
import { UserSubjectSelectionDto } from "./tenant-subject-selection.dto";

// Additional DTOs
@ObjectType()
export class UserSelectionDto {
  @Field()
  hasSelections: boolean;

  @Field(() => UserSchoolSelectionDto, { nullable: true })
  schoolSelection?: UserSchoolSelectionDto;

  @Field(() => [UserSubjectSelectionDto])
  subjectSelections: UserSubjectSelectionDto[];
}
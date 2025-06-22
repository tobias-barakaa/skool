import { Field, ObjectType } from "@nestjs/graphql";
import { SchoolType } from "../entities/school-type";
import { Curriculum } from "src/curriculum/entities/curicula.entity";

@ObjectType()
export class UserSchoolSelectionDto {
  @Field()
  id: string;

  @Field(() => SchoolType)
  schoolType: SchoolType;

  @Field(() => [Curriculum])
  selectedCurricula: Curriculum[];

  @Field()
  updatedAt: Date;
}

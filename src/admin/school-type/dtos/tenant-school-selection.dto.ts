import { Field, ObjectType } from '@nestjs/graphql';
import { Curriculum } from 'src/admin/curriculum/entities/curicula.entity';
import { SchoolType } from '../entities/school-type';

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

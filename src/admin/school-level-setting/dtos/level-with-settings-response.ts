// Create a LevelWithSubjects type for GraphQL response
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Subject } from '../../subject/entities/subject.entity';
import { GradeLevel } from '../../level/entities/grade-level.entity';

@ObjectType()
export class LevelWithSubjects {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [Subject], { nullable: true })
  subjects?: Subject[];

  @Field(() => [GradeLevel], { nullable: true })
  gradeLevel?: GradeLevel[];
}

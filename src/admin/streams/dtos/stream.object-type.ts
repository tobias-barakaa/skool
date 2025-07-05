import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { GradeLevel } from '../../level/entities/grade-level.entity';
import { Student } from '../../student/entities/student.entity';

@ObjectType()
export class StreamType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => Int, { nullable: true })
  capacity?: number;

  @Field()
  isActive: boolean;

  @Field({ nullable: true })
  description?: string;

  @Field(() => GradeLevel)
  gradeLevel: GradeLevel;

//   @Field(() => [Student])
//   students: Student[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
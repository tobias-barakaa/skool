import { InputType, Field, Float, ID, ObjectType } from '@nestjs/graphql';

@InputType()
export class StudentMarkInput {
  @Field(() => ID)
  assessmentId: string;

  @Field(() => Float)
  score: number;
}

@InputType()
export class EnterStudentMarksInput {
  @Field(() => ID)
  studentId: string;

  @Field(() => [StudentMarkInput])
  marks: StudentMarkInput[];
}


@ObjectType()
export class MarksStatsDto {
  @Field()
  mean: string;
  @Field()
  highest: number;
  @Field()
  lowest: number;
  @Field()
  entered: number;
  @Field()
  total: number;
}

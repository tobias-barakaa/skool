import { InputType, Field, Float, ID } from '@nestjs/graphql';

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

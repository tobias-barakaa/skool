import { Field, Float, ID, InputType, Int, ObjectType } from "@nestjs/graphql";
import { IsOptional, MaxLength, Min } from "class-validator";
import { Student } from "src/admin/student/entities/student.entity";
import { Assessment } from "../assessment/entity/assessment.entity";
import GraphQLJSON from 'graphql-type-json';

@InputType()
export class MarkInput {
  @Field(() => ID)
  studentId: string;

  @Field(() => ID)
  assessmentId: string;

  @Field(() => Float)
  score: number;
}

@ObjectType()
export class MarksheetStats {
  @Field(() => Float)
  mean: number;

  @Field(() => Float)
  highest: number;

  @Field(() => Float)
  lowest: number;

  @Field(() => Int)
  entered: number;

  @Field(() => Int)
  total: number;
}

@ObjectType()
export class MarksheetEntry {
  @Field(() => Student)
  student: Student;

  @Field(() => GraphQLJSON)
  marks: any; 

  @Field(() => Float)
  caTotal: number;

  @Field(() => Float)
  examTotal: number;

  @Field(() => Float)
  finalTotal: number;
}

@ObjectType()
export class AssessmentGroups {
  @Field(() => [Assessment])
  cas: Assessment[];

  @Field(() => [Assessment])
  exams: Assessment[];
}

@ObjectType()
export class MarksheetResponse {
  @Field(() => AssessmentGroups)
  assessments: AssessmentGroups;

  @Field(() => [MarksheetEntry])
  entries: MarksheetEntry[];

  @Field(() => MarksheetStats)
  stats: MarksheetStats;
}

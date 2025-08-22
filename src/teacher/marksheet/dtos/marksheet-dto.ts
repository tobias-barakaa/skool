import { Field, Float, InputType, Int, ObjectType } from "@nestjs/graphql";
import { Student } from "src/admin/student/entities/student.entity";
import { Assessment } from "../assessment/entity/assessment.entity";
import GraphQLJSON from "graphql-type-json";
import { Mark } from "../entities/marksheet-entity";

@ObjectType()
export class MarksheetStatistics {
  @Field(() => Float)
  meanScore: number;

  @Field(() => Float)
  highestScore: number;

  @Field(() => Float)
  lowestScore: number;

  @Field(() => Int)
  totalStudents: number;

  @Field(() => Int)
  studentsWithMarks: number;
}

@ObjectType()
export class MarksheetEntry {
  @Field(() => Student)
  student: Student;

  @Field(() => GraphQLJSON)
  marks: { [assessmentId: string]: number | null };

  @Field(() => Float)
  finalScore: number;
}

@ObjectType()
export class MarksheetResponse {
  @Field(() => [Assessment])
  assessments: Assessment[];

  @Field(() => [MarksheetEntry])
  entries: MarksheetEntry[];

  @Field(() => MarksheetStatistics)
  statistics: MarksheetStatistics;
}

@ObjectType()
export class StudentReportResponse {
  @Field(() => Student)
  student: Student;

  @Field(() => [Assessment])
  assessments: Assessment[];

  @Field(() => [Mark])
  marks: Mark[];

  @Field(() => Float)
  totalScore: number;

  @Field(() => Float)
  totalPossible: number;

  @Field(() => Float)
  percentage: number;
}

@InputType()
export class CreateMarkInput {
  @Field()
  studentId: string;

  @Field()
  assessmentId: string;

  @Field(() => Float)
  score: number;

  @Field(() => String)
  comment?: string;
}

@InputType()
export class UpdateMarkInput {
  @Field()
  id: string;

  @Field(() => Float)
  score: number;
}

import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { AssignmentStatus } from './get-assignments.args';

@ObjectType()
export class AssignmentSubject {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;
}

@ObjectType()
export class AssignmentTeacher {
  @Field(() => ID)
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;
}

@ObjectType()
export class AssignmentSubmission {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  submissionText?: string;

  @Field({ nullable: true })
  fileUrl?: string;

  @Field({ nullable: true })
  comments?: string;

  @Field()
  submittedAt: Date;

  @Field({ nullable: true })
  grade?: number;

  @Field({ nullable: true })
  feedback?: string;

  @Field({ nullable: true })
  gradedAt?: Date;
}

@ObjectType()
export class Assignment {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  dueDate: Date;

  @Field(() => Int)
  totalMarks: number;

  @Field({ nullable: true })
  resourceUrl?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => AssignmentSubject)
  subject: AssignmentSubject;

  @Field(() => AssignmentTeacher)
  teacher: AssignmentTeacher;

  @Field(() => AssignmentSubmission, { nullable: true })
  submission?: AssignmentSubmission;

  @Field(() => AssignmentStatus)
  status: AssignmentStatus;
}

@ObjectType()
export class AssignmentsResponse {
  @Field(() => [Assignment])
  assignments: Assignment[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  totalPages: number;

  @Field(() => Int)
  currentPage: number;
}
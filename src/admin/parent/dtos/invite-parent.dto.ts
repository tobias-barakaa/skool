import { ObjectType } from '@nestjs/graphql';

// Updated InviteParentResponse to handle multiple students
@ObjectType()
export class InviteParentRespons {
  @Field()
  email: string;

  @Field()
  name: string;

  @Field(() => InvitationStatus)
  status: InvitationStatus;

  @Field()
  createdAt: Date;

  // Changed from single student to array of students
  @Field(() => [StudentInfo])
  students: StudentInfo[];
}

@ObjectType()
export class StudentInfo {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  admissionNumber: string;

  @Field()
  grade: string;
}

// DTO for adding students to existing parent
@ObjectType()
export class AddStudentsToParentResponse {
  @Field()
  message: string;

  @Field(() => [StudentInfo])
  addedStudents: StudentInfo[];
}

// Input type for bulk student operations
import { InputType, Field, ID } from '@nestjs/graphql';
import { InvitationStatus } from 'src/admin/invitation/entities/user-iInvitation.entity';
import { StudentSearchResponse } from './student-search-response.dto';

@InputType()
export class BulkStudentOperationInput {
  @Field(() => [ID])
  studentIds: string[];

  @Field()
  tenantId: string;
}

// For frontend usage - represents a parent with their students
@ObjectType()
export class ParentWithStudents {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  phone: string;

  @Field()
  isActive: boolean;

  @Field(() => [StudentSearchResponse])
  students: StudentSearchResponse[];
}

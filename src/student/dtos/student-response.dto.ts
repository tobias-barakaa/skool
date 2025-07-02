
// src/students/dtos/create-student-response.ts
import { Field, ObjectType } from '@nestjs/graphql';
import { Student } from '../entities/student.entity';
import { User } from 'src/users/entities/user.entity';

@ObjectType()
export class CreateStudentResponse {
  @Field(() => User)
  user: User;

  @Field(() => Student)
  student: Student;

  @Field()
  generatedPassword: string;
}
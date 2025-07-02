// src/students/dtos/create-student.input.ts
import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateStudentInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  name: string;

  @Field()
  @IsEmail()
  email: string;


  @Field()
  @IsString()
  grade: string;

  @Field()
  @IsString()
  gender: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  admission_number: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  phone: string;

}

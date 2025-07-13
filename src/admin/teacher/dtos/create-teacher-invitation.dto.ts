// 1. First, let's create the DTO for adding a teacher
// src/teacher/dto/create-teacher-invitation.dto.ts
import { Field, ID, InputType } from '@nestjs/graphql';
// import { IsEmail, IsNotEmpty, IsOptional, IsEnum, IsString } from 'class-validator';

import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsBoolean,
} from 'class-validator';

@InputType()
export class CreateTeacherInvitationDto {
  @Field()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Field()
  @IsNotEmpty()
  fullName: string;

  @Field()
  @IsNotEmpty()
  firstName: string;

  @Field()
  @IsNotEmpty()
  lastName: string;

  @Field()
  @IsString()
  role: string;

  @Field()
  @IsString()
  gender: string;

  @Field()
  @IsNotEmpty()
  department: string;

  @Field()
  @IsNotEmpty()
  phoneNumber: string;

  @Field({ nullable: true })
  @IsOptional()
  address?: string;

  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  subjectIds?: string[];

  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  gradeLevelIds?: string[];

  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  streamIds?: string[];

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isClassTeacher?: boolean;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  classTeacherStreamId?: string;

  @Field({ nullable: true })
  @IsOptional()
  employeeId?: string;

  @Field({ nullable: true })
  @IsOptional()
  dateOfBirth?: Date;

  @Field({ nullable: true })
  @IsOptional()
  qualifications?: string;
}

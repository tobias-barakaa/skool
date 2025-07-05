// 1. First, let's create the DTO for adding a teacher
// src/teacher/dto/create-teacher-invitation.dto.ts
import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, IsEnum, IsString } from 'class-validator';


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

  @Field({ nullable: true })
  @IsOptional()
  subject?: string;

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

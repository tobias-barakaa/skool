import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';

export enum ParentLinkingMethod {
  SEARCH_BY_NAME = 'SEARCH_BY_NAME',
  SEARCH_BY_ADMISSION = 'SEARCH_BY_ADMISSION',
  MANUAL_INPUT = 'MANUAL_INPUT',
}


registerEnumType(ParentLinkingMethod, {
  name: 'ParentLinkingMethod', // This name will be used in the GraphQL schema
  description: 'The method used by the parent to link to a student',
});

@InputType()
export class CreateParentInvitationDto {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;

  @Field(() => ParentLinkingMethod)
  @IsEnum(ParentLinkingMethod)
  linkingMethod: ParentLinkingMethod;

  // For search by name
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  studentName?: string;

  // For search by admission number
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  admissionNumber?: string;

  // For manual input - we'll use these to find the student
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  studentFullName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  studentGrade?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  studentPhone?: string;
}

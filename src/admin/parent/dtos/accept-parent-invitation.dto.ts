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
  name: 'ParentLinkingMethod',
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

  
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  studentName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  admissionNumber?: string;

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

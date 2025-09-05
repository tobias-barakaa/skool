import { InputType, Field, ID } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsUUID,
  IsDateString,
  IsPhoneNumber,
} from 'class-validator';

@InputType()
export class CreateTeacherInvitationDto {
  @Field()
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
  @IsNotEmpty()
  role: string;

  @Field()
  @IsNotEmpty()
  gender: string;

  @Field()
  @IsNotEmpty()
  department: string;

  @Field()
  @IsPhoneNumber()
  phoneNumber: string;

  @Field({ nullable: true })
  @IsOptional()
  address?: string;

  @Field({ nullable: true })
  @IsOptional()
  employeeId?: string;

  @Field({ nullable: true })
  @IsOptional()
  dateOfBirth?: string;

  @Field({ nullable: true })
  @IsOptional()
  qualifications?: string;

  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  tenantSubjectIds?: string[];

  @Field(() => [ID], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  tenantGradeLevelIds?: string[];

  // Remove tenantStreamIds - streams will be derived from grade levels

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  classTeacherTenantStreamId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  classTeacherTenantGradeLevelId?: string;
}

// import { InputType, Field, ID } from '@nestjs/graphql';
// import {
//   IsEmail,
//   IsNotEmpty,
//   IsOptional,
//   IsArray,
//   IsUUID,
//   IsDateString,
//   IsPhoneNumber,
// } from 'class-validator';

// @InputType()
// export class CreateTeacherInvitationDto {
//   @Field()
//   @IsEmail()
//   email: string;

//   @Field()
//   @IsNotEmpty()
//   fullName: string;

//   @Field()
//   @IsNotEmpty()
//   firstName: string;

//   @Field()
//   @IsNotEmpty()
//   lastName: string;

//   @Field()
//   @IsNotEmpty()
//   role: string;

//   @Field()
//   @IsNotEmpty()
//   gender: string;

//   @Field()
//   @IsNotEmpty()
//   department: string;

//   @Field()
//   @IsPhoneNumber()
//   phoneNumber: string;

//   @Field({ nullable: true })
//   @IsOptional()
//   address?: string;

//   @Field({ nullable: true })
//   @IsOptional()
//   employeeId?: string;

//   @Field({ nullable: true })
//   @IsOptional()
//   dateOfBirth?: string;

//   @Field({ nullable: true })
//   @IsOptional()
//   qualifications?: string;

//   @Field(() => [ID], { nullable: true })
//   @IsOptional()
//   @IsArray()
//   @IsUUID('all', { each: true })
//   tenantSubjectIds?: string[];

//   @Field(() => [ID], { nullable: true })
//   @IsOptional()
//   @IsArray()
//   @IsUUID('all', { each: true })
//   tenantGradeLevelIds?: string[];

//   @Field(() => [ID], { nullable: true })
//   @IsOptional()
//   @IsArray()
//   @IsUUID('all', { each: true })
//   tenantStreamIds?: string[];

//   @Field(() => ID, { nullable: true })
//   @IsOptional()
//   @IsUUID()
//   classTeacherTenantStreamId?: string;

//   @Field(() => ID, { nullable: true })
//   @IsOptional()
//   @IsUUID()
//   classTeacherTenantGradeLevelId?: string;
// }

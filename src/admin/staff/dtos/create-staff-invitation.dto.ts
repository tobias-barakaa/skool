import { Field, InputType, ObjectType, ID } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsString,
  IsDateString,
  IsNumber,
  IsPhoneNumber,
} from 'class-validator';
import { InvitationType } from 'src/admin/invitation/entities/user-iInvitation.entity';
import { StaffStatus } from '../entities/staff.entity';
import { TokensOutput } from 'src/admin/users/dtos/tokens.output';

@InputType()
export class CreateStaffInvitationDto {
  @Field()
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @Field()
  @IsEmail()
  email: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @Field()
  @IsString()
  gender: string;

  @Field()
  @IsString()
  role: InvitationType.STAFF;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  dateOfJoining?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  address?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  salary?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  bankAccount?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  bankName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  department?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  supervisor?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  jobDescription?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  qualifications?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  workExperience?: string;
}

@ObjectType()
export class StaffDto {
  @Field(() => ID)
  id: string;

  @Field()
  fullName: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  phoneNumber?: string;

  @Field()
  gender: string;

  @Field()
  role: string;

  @Field(() => StaffStatus)
  status: StaffStatus;

  @Field({ nullable: true })
  employeeId?: string;

  @Field({ nullable: true })
  nationalId?: string;

  @Field({ nullable: true })
  dateOfBirth?: Date;

  @Field({ nullable: true })
  dateOfJoining?: Date;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  emergencyContact?: string;

  @Field({ nullable: true })
  emergencyContactPhone?: string;

  @Field({ nullable: true })
  salary?: number;

  @Field({ nullable: true })
  bankAccount?: string;

  @Field({ nullable: true })
  bankName?: string;

  @Field({ nullable: true })
  department?: string;

  @Field({ nullable: true })
  supervisor?: string;

  @Field({ nullable: true })
  jobDescription?: string;

  @Field({ nullable: true })
  qualifications?: string;

  @Field({ nullable: true })
  workExperience?: string;

  @Field()
  isActive: boolean;

  @Field()
  hasCompletedProfile: boolean;

  @Field({ nullable: true })
  userId?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class InviteStaffResponse {
  @Field()
  email: string;

  @Field()
  fullName: string;

  @Field()
  status: string;

  @Field()
  createdAt: Date;
}

@InputType()
export class AcceptStaffInvitationInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  token: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  password: string;
}





@ObjectType()
export class UserInfo {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;
}



@ObjectType()
export class StaffInfo {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  role: string;
}

@ObjectType()
export class AcceptStaffInvitationResponse {
  @Field()
  message: string;

  @Field(() => UserInfo)
  user: UserInfo;

  @Field(() => TokensOutput)
  tokens: TokensOutput;

  @Field(() => StaffInfo, { nullable: true })
  staff?: StaffInfo;
}




@InputType()
export class UpdateStaffInput {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  fullName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  firstName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  lastName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @Field()
  gender: string;

  @Field()
  role?: string;

  @Field(() => StaffStatus, { nullable: true })
  @IsOptional()
  @IsEnum(StaffStatus)
  status?: StaffStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  dateOfJoining?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  address?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  salary?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  bankAccount?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  bankName?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  department?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  supervisor?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  jobDescription?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  qualifications?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  workExperience?: string;
}

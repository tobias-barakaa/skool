import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsEmail, IsOptional, IsString, ValidateNested } from "class-validator";

export class CreateParentInvitationDto {
  @IsEmail()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentLinkInput)
  students: StudentLinkInput[];
}

export class StudentLinkInput {
  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsString()
  admissionNumber?: string;

  @IsOptional()
  @IsString()
  studentName?: string;

  @IsOptional()
  @IsString()
  studentPhone?: string;

  @IsOptional()
  @IsString()
  studentGrade?: string;

  @IsString()
  relationship: string; // 'FATHER', 'MOTHER', 'GUARDIAN', etc.

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

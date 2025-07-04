import { InputType, Field, ID } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsArray,
  ArrayMinSize,
} from 'class-validator';

@InputType()
export class StudentLinkInput {
  @Field({ nullable: true })
  @IsOptional()
  studentId?: string;

  @Field({ nullable: true })
  @IsOptional()
  admissionNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  studentName?: string;

  @Field({ nullable: true })
  @IsOptional()
  studentPhone?: string;

  @Field({ nullable: true })
  @IsOptional()
  studentGrade?: string;

  @Field()
  @IsNotEmpty()
  relationship: string; 

  @Field({ nullable: true })
  @IsOptional()
  isPrimary?: boolean;
}

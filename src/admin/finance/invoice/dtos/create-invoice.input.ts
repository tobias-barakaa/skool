import { InputType, Field, ID, Float } from '@nestjs/graphql';
import { IsUUID, IsOptional, IsString, IsDateString, IsNumber, Min, IsArray } from 'class-validator';

@InputType()
export class CreateInvoiceInput {
  @Field(() => ID, { nullable: true, description: 'Student ID - required if not generating for all students' })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @Field(() => ID)
  @IsUUID()
  termId: string;

  @Field(() => [ID], { nullable: true, description: 'Specific tenant grade level IDs to generate invoices for' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tenantGradeLevelIds?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}
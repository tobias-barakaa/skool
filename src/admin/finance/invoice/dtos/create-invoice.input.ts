import { InputType, Field, ID, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUUID, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';

@InputType({ description: 'Input type for creating a new invoice' })
export class CreateInvoiceInput {
  @Field(() => ID, { description: 'The ID of the student' })
  @IsNotEmpty()
  @IsUUID()
  studentId: string;

  @Field(() => ID, { description: 'The ID of the academic year' })
  @IsNotEmpty()
  @IsUUID()
  academicYearId: string;

  @Field(() => ID, { description: 'The ID of the term' })
  @IsNotEmpty()
  @IsUUID()
  termId: string;

  @Field(() => Float, { description: 'The total amount of the invoice' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @Field({ description: 'The due date for payment' })
  @IsNotEmpty()
  @IsDateString()
  dueDate: string;

  @Field({ nullable: true, description: 'Additional notes or description' })
  @IsOptional()
  @IsString()
  description?: string;
}

@InputType({ description: 'Input type for updating an invoice' })
export class UpdateInvoiceInput {
  @Field(() => Float, { nullable: true, description: 'The total amount of the invoice' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;

  @Field({ nullable: true, description: 'The due date for payment' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @Field({ nullable: true, description: 'Additional notes or description' })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true, description: 'Whether the invoice is active' })
  @IsOptional()
  isActive?: boolean;
}
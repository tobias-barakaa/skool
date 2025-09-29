
import { InputType, Field, ID, Float, ObjectType, Int } from "@nestjs/graphql";
import { IsUUID, IsOptional, IsString, IsNumber, IsEnum, IsDateString, IsBoolean, IsArray, Min } from "class-validator";
import { Invoice } from "../entities/invoice.entity";
import { PaymentMethod } from "../../payment/entities/payment.entity";
// import { Invoice } from "../entities/invoice.entity";

@InputType()
export class CreateInvoiceInput {
  @Field(() => ID)
  @IsUUID()
  studentId: string;

  @Field(() => ID)
  @IsUUID()
  termId: string;

  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  feeAssignmentId?: string;

  @Field()
  @IsDateString()
  dueDate: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;
}

@InputType()
export class CreateBulkInvoicesInput {
  @Field(() => [ID])
  @IsArray()
  @IsUUID(undefined, { each: true })
  tenantGradeLevelIds: string[];

  @Field(() => ID)
  @IsUUID()
  termId: string;

  @Field()
  @IsDateString()
  dueDate: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;
}

@InputType()
export class CreatePaymentInput {
  @Field(() => ID)
  @IsUUID()
  invoiceId: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @Field(() => PaymentMethod)
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  transactionReference?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  paymentDate?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;
}

@ObjectType()
export class BulkInvoiceResult {
  @Field(() => Int)
  success: number;

  @Field(() => Int)
  failed: number;

  @Field(() => [Invoice])
  invoices: Invoice[];
}
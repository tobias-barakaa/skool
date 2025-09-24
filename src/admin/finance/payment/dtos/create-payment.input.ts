import { InputType, Field, ID, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUUID, IsNumber, IsOptional, IsDateString, IsEnum, Min } from 'class-validator';
import { PaymentMethod, PaymentStatus } from '../entities/payment.entity';

@InputType({ description: 'Input type for creating a new payment' })
export class CreatePaymentInput {
  @Field(() => ID, { description: 'The ID of the student making the payment' })
  @IsNotEmpty()
  @IsUUID()
  studentId: string;

  @Field(() => ID, { nullable: true, description: 'The ID of the invoice this payment is for' })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @Field(() => Float, { description: 'The amount paid' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @Field(() => PaymentMethod, { description: 'The method used for payment' })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @Field({ description: 'The date when the payment was made' })
  @IsNotEmpty()
  @IsDateString()
  paymentDate: string;

  @Field({ nullable: true, description: 'Transaction ID from payment provider' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @Field({ nullable: true, description: 'Additional notes about the payment' })
  @IsOptional()
  @IsString()
  notes?: string;
}

@InputType({ description: 'Input type for updating a payment' })
export class UpdatePaymentInput {
  @Field(() => Float, { nullable: true, description: 'The amount paid' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @Field(() => PaymentMethod, { nullable: true, description: 'The method used for payment' })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @Field(() => PaymentStatus, { nullable: true, description: 'The status of the payment' })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @Field({ nullable: true, description: 'The date when the payment was made' })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @Field({ nullable: true, description: 'Transaction ID from payment provider' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @Field({ nullable: true, description: 'Additional notes about the payment' })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field({ nullable: true, description: 'Whether the payment is active' })
  @IsOptional()
  isActive?: boolean;
}
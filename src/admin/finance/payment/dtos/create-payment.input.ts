
import { InputType, Field, Float, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsEnum, IsPositive, IsDateString, IsUUID } from 'class-validator';
import { PaymentMethod } from '../entities/payment.entity';

@InputType()
export class CreatePaymentInput {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  invoiceId: string;

  @Field(() => Float)
  @IsPositive()
  @IsNotEmpty()
  amount: number;

  // @Field(() => PaymentMethod)
  // @IsEnum(PaymentMethod)
  // @IsNotEmpty()
  // paymentMethod: PaymentMethod;

  @Field({ nullable: true })
  @IsOptional()
  paymentMethod?: string;

  @Field({ nullable: true })
  @IsOptional()
  transactionReference?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  notes?: string;
}

@InputType()
export class UpdatePaymentInput {
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsPositive()
  amount?: number;

  @Field(() => PaymentMethod, { nullable: true })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @Field({ nullable: true })
  @IsOptional()
  transactionReference?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  notes?: string;
}

@InputType()
export class PaymentFilters {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  // @Field(() => PaymentMethod, { nullable: true })
  // @IsOptional()
  // @IsEnum(PaymentMethod)
  // paymentMethod?: PaymentMethod;
  @Field({ nullable: true })
  @IsOptional()
  paymentMethod?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  receiptNumber?: string;
}

@InputType()
export class DateRangeInput {
  @Field()
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @Field()
  @IsNotEmpty()
  @IsDateString()
  endDate: string;
}
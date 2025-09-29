import { InputType, Field, ID, Float } from '@nestjs/graphql';
import { IsUUID, IsEnum, IsOptional, IsString, IsDateString, IsNumber, Min } from 'class-validator';
import { PaymentMethod } from '../entities/payment.entity';

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
  @IsOptional()
  @IsString()
  transactionReference?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}
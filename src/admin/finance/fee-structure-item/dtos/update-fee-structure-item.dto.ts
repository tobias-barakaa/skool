import { InputType, Field, Float, ID } from '@nestjs/graphql';
import { IsUUID, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

@InputType({ description: 'Input for creating a new fee structure item' })
export class UpdateFeeStructureItemInput {
  @Field(() => ID, { description: 'The ID of the fee structure' })
  @IsUUID('4', { message: 'Fee structure ID must be a valid UUID' })
  feeStructureId: string;

  @Field(() => ID, { description: 'The ID of the fee bucket' })
  @IsUUID('4', { message: 'Fee bucket ID must be a valid UUID' })
  feeBucketId: string;

  @Field(() => Float, { description: 'The amount for this fee item' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Amount must be a valid number with at most 2 decimal places' })
  @Min(0, { message: 'Amount must be greater than or equal to 0' })
  amount: number;

  @Field({ description: 'Indicates if this fee item is mandatory', defaultValue: true })
  @IsBoolean({ message: 'isMandatory must be a boolean value' })
  @IsOptional()
  isMandatory?: boolean;
}
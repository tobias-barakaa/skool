import { InputType, Field, Float, ID } from '@nestjs/graphql';
import { IsUUID, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';


@InputType({ description: 'Input for updating a fee structure item (partial)' })
export class UpdateFeeStructureItemInput {
  @Field(() => ID, { nullable: true })
  @IsUUID('4', { message: 'Fee bucket ID must be a valid UUID' })
  @IsOptional()                                   
  feeBucketId?: string;

  @Field(() => Float, { nullable: true })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()                                 
  amount?: number;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()                                  
  isMandatory?: boolean;
}


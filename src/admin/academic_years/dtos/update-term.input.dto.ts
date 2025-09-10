import { InputType, Field, ID } from '@nestjs/graphql';
import { IsDateString, IsOptional, IsUUID, MaxLength, MinLength, Validate } from 'class-validator';
import { IsAfter } from '../validators/date.validator';

@InputType({ description: 'Input for updating a term' })
export class UpdateTermInput {
  @Field({ nullable: true }) @IsOptional() @MinLength(2) @MaxLength(30) name?: string;
  @Field({ nullable: true }) @IsOptional() @IsDateString() startDate?: string;
//   @Field({ nullable: true }) @IsOptional() @IsDateString() @Validate(IsAfter, ['startDate']) endDate?: string;
  @Field({ nullable: true }) @IsOptional() @IsDateString() endDate?: string;  
  @Field({ nullable: true }) @IsOptional() isActive?: boolean;
  @Field({ nullable: true })
		@IsOptional()
		isCurrent?: boolean
}


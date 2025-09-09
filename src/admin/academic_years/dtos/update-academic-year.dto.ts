import { InputType, Field } from '@nestjs/graphql';
import { IsDateString, IsNotEmpty, IsOptional, MaxLength, MinLength, Validate } from 'class-validator';
import { IsAfter } from '../validators/date.validator';

@InputType()
export class UpdateAcademicYearInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(50)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  @Validate(IsAfter, ['startDate'], { message: 'End date must be after start date' })
  endDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  isActive?: boolean;

  @Field({ nullable: true })
		@IsOptional()
		isCurrent?: boolean
}


import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsDateString, MinLength, MaxLength, Validate } from 'class-validator';
import { IsAfter } from '../validators/date.validator';

@InputType()
export class CreateAcademicYearInput {
  @Field()
  @IsNotEmpty({ message: 'Academic year name is required' })
  @MinLength(4, { message: 'Academic year name must be at least 4 characters' })
  @MaxLength(50, { message: 'Academic year name cannot exceed 50 characters' })
  name: string;

  @Field()
  @IsDateString({}, { message: 'Start date must be a valid date string (YYYY-MM-DD)' })
  startDate: string;

  @Field()
  @IsDateString({}, { message: 'End date must be a valid date string (YYYY-MM-DD)' })
  @Validate(IsAfter, ['startDate'], { message: 'End date must be after start date' })
  endDate: string; 
}
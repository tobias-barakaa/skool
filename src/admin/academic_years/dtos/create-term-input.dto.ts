import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsDateString, IsUUID, MinLength, MaxLength, Validate } from 'class-validator';
import { IsAfter } from '../validators/date.validator';


@InputType({ description: 'Input data for creating a new term' })
export class CreateTermInput {
 
  @Field({ description: 'The name of the term' })
  @IsNotEmpty({ message: 'Term name is required' })
  @MinLength(2, { message: 'Term name must be at least 2 characters' })
  @MaxLength(30, { message: 'Term name cannot exceed 30 characters' })
  name: string;

  
  @Field({ description: 'The start date of the term (YYYY-MM-DD)' })
  @IsDateString({}, { message: 'Start date must be a valid date string (YYYY-MM-DD)' })
  startDate: string;

  
  @Field({ description: 'The end date of the term (YYYY-MM-DD). Must be after start date.' })
  @IsDateString({}, { message: 'End date must be a valid date string (YYYY-MM-DD)' })
  @Validate(IsAfter, ['startDate'], { message: 'End date must be after start date' })
  endDate: string;

  @Field(() => ID, { description: 'The ID of the academic year to which this term belongs' })
  @IsUUID(4, { message: 'Academic year ID must be a valid UUID' })
  academicYearId: string;
}
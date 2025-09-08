import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsDateString, IsUUID, MinLength, MaxLength, Validate } from 'class-validator';
import { IsAfter } from '../validators/date.validator';

@InputType()
export class CreateTermInput {
  @Field()
  @IsNotEmpty({ message: 'Term name is required' })
  @MinLength(2, { message: 'Term name must be at least 2 characters' })
  @MaxLength(30, { message: 'Term name cannot exceed 30 characters' })
  name: string;

  @Field()
  @IsDateString({}, { message: 'Start date must be a valid date string (YYYY-MM-DD)' })
  startDate: string;

  @Field()
  @IsDateString({}, { message: 'End date must be a valid date string (YYYY-MM-DD)' })
  @Validate(IsAfter, ['startDate'], { message: 'End date must be after start date' })
  endDate: string;

  @Field(() => ID)
  @IsUUID(4, { message: 'Academic year ID must be a valid UUID' })
  academicYearId: string;
}
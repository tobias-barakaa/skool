import { InputType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsString, IsEnum, Min, Max, IsOptional } from 'class-validator';
import { BreakType } from '../entities/timetable_break.entity';

@InputType()
export class CreateTimetableBreakInput {
  @Field()
  @IsString()
  name: string;

  @Field(() => BreakType)
  @IsEnum(BreakType)
  type: BreakType;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  @Max(5)
  dayOfWeek: number; // 0 = all days, 1-5 = specific day

  @Field(() => Int)
  @IsInt()
  @Min(1)
  afterPeriod: number;

  @Field(() => Int)
  @IsInt()
  @Min(5)
  durationMinutes: number;

  @Field({ nullable: true })
  @IsString()
  icon?: string;

  @Field({ nullable: true })
@IsString()
@IsOptional() 
color?: string;
}

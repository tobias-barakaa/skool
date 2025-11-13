import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { BreakType } from '../entities/timetable_break.entity';

@InputType()
export class UpdateTimetableBreakInput {
  @Field()
  @IsString()
  id: string; // UUID of the break

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => BreakType, { nullable: true })
  @IsOptional()
  @IsEnum(BreakType)
  type?: BreakType;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  dayOfWeek?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  afterPeriod?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  icon?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  color?: string;
}

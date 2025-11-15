import { InputType, Field, Int, ObjectType } from '@nestjs/graphql';
import { IsInt, IsString, IsEnum, Min, Max, IsOptional } from 'class-validator';
import { BreakType } from '../entities/timetable_break.entity';
import { GraphQLJSONObject } from 'graphql-type-json';
import { TimetableEntry } from '../entities/timetable_entries.entity';

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


@ObjectType()
export class TeacherWeeklySummary {
  @Field(() => Int)
  totalClasses: number;

  @Field(() => GraphQLJSONObject)
  classesByDay: Record<number, number>;

  @Field(() => GraphQLJSONObject)
  classesByGrade: Record<string, number>;

  @Field(() => GraphQLJSONObject)
  classesBySubject: Record<string, number>;

  @Field(() => [TimetableEntry])
  entries: TimetableEntry[];
}


@ObjectType()
export class TeacherLoadSummary {
  @Field()
  teacherId: string;

  @Field()
  teacherName: string;

  @Field(() => Int)
  totalClasses: number;

  @Field(() => [String])
  subjects: string[];

  @Field(() => [String])
  grades: string[];
}


@ObjectType()
export class TeacherConflict {
  @Field()
  teacherId: string;

  @Field()
  teacherName: string;

  @Field(() => Int)
  dayOfWeek: number;

  @Field()
  timeSlotId: string;

  @Field(() => [TimetableEntry])
  conflictingEntries: TimetableEntry[];
}

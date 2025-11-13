import { ObjectType, Field, Int } from '@nestjs/graphql';
import { TimeSlot } from '../entities/time_slots.entity';
import { TimetableBreak } from '../entities/timetable_break.entity';
import { TimetableEntry } from '../entities/timetable_entries.entity';

@ObjectType()
export class TimetableResponse {
  @Field(() => [TimeSlot])
  timeSlots: TimeSlot[];

  @Field(() => [TimetableBreak])
  breaks: TimetableBreak[];

  @Field(() => [TimetableEntry])
  entries: TimetableEntry[];
}

@ObjectType()
export class TimetableCell {
  @Field(() => Int)
  dayOfWeek: number;

  @Field(() => Int)
  periodNumber: number;

  @Field({ nullable: true })
  isBreak?: boolean;

  @Field(() => TimetableBreak, { nullable: true })
  breakData?: TimetableBreak;

  @Field(() => TimetableEntry, { nullable: true })
  entryData?: TimetableEntry;
}

@ObjectType()
export class GradeTimetableResponse {
  @Field()
  gradeId: string;

  @Field()
  gradeName: string;

  @Field(() => [TimeSlot])
  timeSlots: TimeSlot[];

  @Field(() => [TimetableCell])
  cells: TimetableCell[];
}
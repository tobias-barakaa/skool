import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { TimeSlot } from '../entities/time_slots.entity';
import { TimetableBreak } from '../entities/timetable_break.entity';
import { TimetableEntry } from '../entities/timetable_entries.entity';

// CRITICAL: This matches transformMockData() return type
@ObjectType()
export class TimetableData {
  @Field(() => [TimeSlot])
  timeSlots: TimeSlot[];

  @Field(() => [TimetableBreak])
  breaks: TimetableBreak[];

  @Field(() => [TimetableEntry])
  entries: TimetableEntry[];

  @Field(() => [GradeInfo])
  grades: GradeInfo[];

  @Field()
  lastUpdated: string;
}

// Simplified grade info for frontend
@ObjectType()
export class GradeInfo {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  displayName: string;

  @Field(() => Int)
  level: number;
}
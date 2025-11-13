import { Module } from '@nestjs/common';
import { Type } from 'class-transformer';
import { TimetableService } from './services/timetable.service';
import { TimetableEntry } from './entities/timetable_entries.entity';
import { TimetableBreak } from './entities/timetable_break.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeSlot } from './entities/time_slots.entity';
import { BreakSchedule } from './entities/break_schedules.entity';
import { TimetableResolver } from './resolver/timetable.resolver';


@Module({
  imports: [TypeOrmModule.forFeature([TimetableEntry, TimetableBreak,TimeSlot,BreakSchedule ])],
  exports: [TimeTableModule],
  providers: [TimetableService,TimetableResolver],
})
export class TimeTableModule {}

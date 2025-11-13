import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { TimetableService } from '../services/timetable.service';
import { TimeSlot } from '../entities/time_slots.entity';
import { CreateTimeSlotInput } from '../dtos/create_time_slot';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { UpdateTimeSlotInput } from '../dtos/update_time_slot.dto';
import { TimetableBreak } from '../entities/timetable_break.entity';
import { CreateTimetableBreakInput } from '../dtos/create_timetable_break.dto';
import { TimetableEntry } from '../entities/timetable_entries.entity';
import { BulkCreateTimetableEntryInput, CreateTimetableEntryInput } from '../dtos/create-timetable-entry.input';
import { GradeTimetableResponse } from '../dtos/timetable-response.dto';
import { Roles } from 'src/admin/auth/decorator/roles.decorator';
import { MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';

@Resolver()
export class TimetableResolver {
  constructor(private readonly timetableService: TimetableService) {}

  // ========== TIME SLOTS ==========
  @Mutation(() => TimeSlot)
  @Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.TEACHER)
  async createTimeSlot(
    @Args('input') input: CreateTimeSlotInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TimeSlot> {
    return this.timetableService.createTimeSlot(user, input);
  }

  @Query(() => [TimeSlot])
  async getTimeSlots(
    @ActiveUser() user: ActiveUserData,
  ): Promise<TimeSlot[]> {
    return this.timetableService.getTimeSlots(user);
  }

  @Mutation(() => TimeSlot)
  async updateTimeSlot(
    @Args('id') id: string,
    @Args('input') input: UpdateTimeSlotInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TimeSlot> {
    return this.timetableService.updateTimeSlot(id, user, input);
  }

  @Mutation(() => Boolean)
  async deleteTimeSlot(
    @Args('id') id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<boolean> {
    return this.timetableService.deleteTimeSlot(id, user);
  }

  // ========== BREAKS ==========
  @Mutation(() => TimetableBreak)
  async createTimetableBreak(
    @Args('input') input: CreateTimetableBreakInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TimetableBreak> {
    return this.timetableService.createBreak(user, input);
  }

  @Query(() => [TimetableBreak])
  async getTimetableBreaks(
    @Args('dayOfWeek', { nullable: true }) dayOfWeek: number,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TimetableBreak[]> {
    return this.timetableService.getBreaks(user, dayOfWeek);
  }

  @Mutation(() => Boolean)
  async deleteTimetableBreak(
    @Args('id') id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<boolean> {
    return this.timetableService.deleteBreak(id, user);
  }

  // ========== TIMETABLE ENTRIES ==========
  @Mutation(() => TimetableEntry)
  async createTimetableEntry(
    @Args('input') input: CreateTimetableEntryInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TimetableEntry> {
    return this.timetableService.createEntry(user, input);
  }

  @Mutation(() => [TimetableEntry])
  async bulkCreateTimetableEntries(
    @Args('input') input: BulkCreateTimetableEntryInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TimetableEntry[]> {
    return this.timetableService.bulkCreateEntries(user, input);
  }

  @Query(() => [TimetableEntry])
  async getGradeTimetableEntries(
    @Args('termId') termId: string,
    @Args('gradeId') gradeId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TimetableEntry[]> {
    return this.timetableService.getEntriesForGrade(
      user,
      termId,
      gradeId,
    );
  }

  @Query(() => [TimetableEntry])
  async getTeacherSchedule(
    @Args('termId') termId: string,
    @Args('teacherId') teacherId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TimetableEntry[]> {
    return this.timetableService.getTeacherSchedule(
      user,
      termId,
      teacherId,
    );
  }

  @Query(() => GradeTimetableResponse)
  async getCompleteTimetable(
    @Args('termId') termId: string,
    @Args('gradeId') gradeId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<GradeTimetableResponse> {
    return this.timetableService.getCompleteTimetable(
      user,
      termId,
      gradeId,
    );
  }

  @Mutation(() => TimetableEntry)
  async updateTimetableEntry(
    @Args('id') id: string,
    @Args('input') input: CreateTimetableEntryInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TimetableEntry> {
    return this.timetableService.updateEntry(id, user, input);
  }

  @Mutation(() => Boolean)
  async deleteTimetableEntry(
    @Args('id') id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<boolean> {
    return this.timetableService.deleteEntry(id, user);
  }
}
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { TimetableService } from '../services/timetable.service';
import { TimeSlot } from '../entities/time_slots.entity';
import { CreateTimeSlotInput, DeleteTimetableEntryInput, UpdateTimetableEntryInput } from '../dtos/create_time_slot';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { UpdateTimeSlotInput } from '../dtos/update_time_slot.dto';
import { TimetableBreak } from '../entities/timetable_break.entity';
import { CreateTimetableBreakInput, TeacherConflict, TeacherLoadSummary, TeacherWeeklySummary } from '../dtos/create_timetable_break.dto';
import { TimetableEntry } from '../entities/timetable_entries.entity';
import { BulkCreateTimetableEntryInput, CreateTimetableEntryInput } from '../dtos/create-timetable-entry.input';
import { GradeTimetableResponse } from '../dtos/timetable-response.dto';
import { Roles } from 'src/admin/auth/decorator/roles.decorator';
import { MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { TimetableData } from '../dtos/timetable_response.dto';

@Resolver()
export class TimetableResolver {
  constructor(private readonly timetableService: TimetableService) {}

  // ========== TIME SLOTS ==========
  @Mutation(() => TimeSlot)
  // @Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.TEACHER)
  @Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.TEACHER, MembershipRole.STUDENT, MembershipRole.PARENT)
  async createTimeSlot(
    @Args('input') input: CreateTimeSlotInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TimeSlot> {
    return this.timetableService.createTimeSlot(user, input);
  }

  @Query(() => [TimeSlot])
@Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.TEACHER, MembershipRole.STUDENT, MembershipRole.PARENT)

  async getTimeSlots(
    @ActiveUser() user: ActiveUserData,
  ): Promise<TimeSlot[]> {
    return this.timetableService.getTimeSlots(user);
  }

  @Mutation(() => TimeSlot)
  @Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.TEACHER, MembershipRole.STUDENT, MembershipRole.PARENT)
  async updateTimeSlot(
    @Args('id') id: string,
    @Args('input') input: UpdateTimeSlotInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TimeSlot> {
    return this.timetableService.updateTimeSlot(id, user, input);
  }

//   @Mutation(() => TimeSlot)
// async updateTimeSlot(
//   @Args('input') input: UpdateTimeSlotInput,
//   @ActiveUser() user: ActiveUserData,
// ): Promise<TimeSlot> {
//   return this.timetableService.updateTimeSlot(user, input);
// }

  @Mutation(() => Boolean)
@Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.TEACHER, MembershipRole.STUDENT, MembershipRole.PARENT)
  async deleteTimeSlot(
    @Args('id') id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<boolean> {
    return this.timetableService.deleteTimeSlot(id, user);
  }



  @Mutation(() => Boolean)
@Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.TEACHER, MembershipRole.STUDENT, MembershipRole.PARENT)

async deleteAllTimeSlots(
  @ActiveUser() user: ActiveUserData,
): Promise<boolean> {
  return this.timetableService.deleteAllTimeSlots(user);
}


  // ========== BREAKS ==========
  @Mutation(() => TimetableBreak)
@Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.TEACHER, MembershipRole.STUDENT, MembershipRole.PARENT)

  async createTimetableBreak(
    @Args('input') input: CreateTimetableBreakInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TimetableBreak> {
    return this.timetableService.createBreak(user, input);
  }



//   @Mutation(() => Boolean)
// async deleteTimetableBreak(
//   @Args('id') id: string,
//   @ActiveUser() user: ActiveUserData,
// ): Promise<boolean> {
//   return this.timetableService.deleteBreak(id, user);
// }

@Mutation(() => Boolean)
@Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.TEACHER, MembershipRole.STUDENT, MembershipRole.PARENT)

async deleteAllTimetableBreaks(
  @ActiveUser() user: ActiveUserData,
): Promise<boolean> {
  return this.timetableService.deleteAllBreaks(user);
}



@Query(() => [TimetableEntry])
@Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.TEACHER, MembershipRole.STUDENT, MembershipRole.PARENT)
async getFulltimetableEntries(
  @ActiveUser() user: ActiveUserData,
): Promise<TimetableEntry[]> {
  return this.timetableService.getAllEntries(user);
}

  @Query(() => [TimetableBreak])
  @Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.TEACHER, MembershipRole.STUDENT, MembershipRole.PARENT)
  async getTimetableBreaks(
    @Args('dayOfWeek', { nullable: true }) dayOfWeek: number,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TimetableBreak[]> {
    return this.timetableService.getBreaks(user, dayOfWeek);
  }

  @Mutation(() => Boolean)
@Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.TEACHER, MembershipRole.STUDENT, MembershipRole.PARENT)
  async deleteTimetableBreak(
    @Args('id') id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<boolean> {
    return this.timetableService.deleteBreak(id, user);
  }

  // ========== TIMETABLE ENTRIES ==========
  @Mutation(() => TimetableEntry)
@Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.TEACHER, MembershipRole.STUDENT, MembershipRole.PARENT)
  async createTimetableEntry(
    @Args('input') input: CreateTimetableEntryInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TimetableEntry> {
    return this.timetableService.createEntry(user, input);
  }

  @Mutation(() => [TimetableEntry])
@Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.TEACHER, MembershipRole.STUDENT, MembershipRole.PARENT)
  async bulkCreateTimetableEntries(
    @Args('input') input: BulkCreateTimetableEntryInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TimetableEntry[]> {
    return this.timetableService.bulkCreateEntries(user, input);
  };


  @Mutation(() => TimetableEntry)
@Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.TEACHER, MembershipRole.STUDENT, MembershipRole.PARENT)

  async updateTimetableEntry(
    @Args('input') input: UpdateTimetableEntryInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TimetableEntry> {
    return this.timetableService.updateEntry(user, input);
  }

  // ========== DELETE ENTRY ==========
  @Mutation(() => Boolean)
  async deleteTimetableEntry(
    @Args('input') input: DeleteTimetableEntryInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<boolean> {
    return this.timetableService.deleteEntry(user, input);
  }


@Query(() => [TimetableEntry], { name: 'timetableEntries' }) 
@Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.TEACHER, MembershipRole.STUDENT, MembershipRole.PARENT)
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
@Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.TEACHER, MembershipRole.STUDENT, MembershipRole.PARENT)
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
@Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.TEACHER, MembershipRole.STUDENT, MembershipRole.PARENT)

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

  

  // @Mutation(() => TimetableEntry)
  // async updateTimetableEntry(
  //   @Args('id') id: string,
  //   @Args('input') input: CreateTimetableEntryInput,
  //   @ActiveUser() user: ActiveUserData,
  // ): Promise<TimetableEntry> {
  //   return this.timetableService.updateEntry(id, user, input);
  // }

  // @Mutation(() => Boolean)
  // async deleteTimetableEntry(
  //   @Args('id') id: string,
  //   @ActiveUser() user: ActiveUserData,
  // ): Promise<boolean> {
  //   return this.timetableService.deleteEntry(id, user);
  // }

  @Query(() => TimetableData, { 
    name: 'getWholeSchoolTimetable',
    description: 'Get complete timetable data for entire school - matches frontend transformMockData() structure'
  })
@Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.TEACHER, MembershipRole.STUDENT, MembershipRole.PARENT)

  async getWholeSchoolTimetable(
    @Args('termId') termId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TimetableData> {
    return this.timetableService.getWholeSchoolTimetable(user, termId);
  }

  @Query(() => TimetableData, {
    name: 'getTeacherTimetable',
    description: 'Get timetable data for a specific teacher for a given term',
  })
@Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.TEACHER, MembershipRole.STUDENT, MembershipRole.PARENT)

  async getTeacherTimetable(
    @Args('termId') termId: string,
    @Args('teacherId') teacherId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TimetableData> {
    return this.timetableService.getTeacherTimetableData(
      user,
      termId,
      teacherId,
    );
  }


  @Query(() => TeacherWeeklySummary, {
    name: 'getTeacherWeeklySummary',
    description: 'Returns weekly class summary for a specific teacher',
  })
@Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.TEACHER, MembershipRole.STUDENT, MembershipRole.PARENT)

  async getTeacherWeeklySummary(
    @Args('termId') termId: string,
    @Args('teacherId') teacherId: string,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.timetableService.getTeacherWeeklySummary(
      user,
      termId,
      teacherId,
    );
  }
  

  @Query(() => [TeacherLoadSummary], {
    name: 'getAllTeachersWithLoad',
    description: 'Get teaching load summary for all teachers in a tenant for a given term',
  })
@Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.TEACHER, MembershipRole.STUDENT, MembershipRole.PARENT)

  async getAllTeachersWithLoad(
    @Args('termId') termId: string,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.timetableService.getAllTeachersWithLoad(
      user,
      termId,
    );
  }

  @Query(() => [TeacherConflict], {
    name: 'getTeacherConflicts',
    description: 'Find timetable conflicts where a teacher is assigned multiple classes at the same time',
  })
  async getTeacherConflicts(
    @Args('termId') termId: string,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.timetableService.getTeacherConflicts(
      user,
      termId,
    );
  }
  

  @Query(() => [TimetableEntry], {
    name: 'getMultipleGradeTimetables',
    description: 'Get timetable entries for multiple grades in a single query',
  })
@Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.TEACHER, MembershipRole.STUDENT, MembershipRole.PARENT)

  async getMultipleGradeTimetables(
    @Args('termId') termId: string,
    @Args({ name: 'gradeIds', type: () => [String] }) gradeIds: string[],
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.timetableService.getMultipleGradeTimetables(
      user,
      termId,
      gradeIds,
    );
  }
  
  

  @Query(() => TimetableData, {
    name: 'getMyTimetable',
    description: 'Get timetable for the currently logged-in teacher'
  })
@Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.TEACHER, MembershipRole.STUDENT, MembershipRole.PARENT)
  async getMyTimetable(
    @Args('termId') termId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TimetableData> {
    // user.sub is the teacher's user ID
    return this.timetableService.getMyTimetableAsTeacher(
      user,
      termId,
    );
  }

  
}


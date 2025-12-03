import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { TimeSlot } from '../entities/time_slots.entity';
import { TimetableBreak } from '../entities/timetable_break.entity';
import { TimetableEntry } from '../entities/timetable_entries.entity';
import { CreateTimeSlotInput } from '../dtos/create_time_slot';
import { UpdateTimeSlotInput } from '../dtos/update_time_slot.dto';
import { CreateTimetableBreakInput } from '../dtos/create_timetable_break.dto';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { GradeTimetableResponse, TimetableCell } from '../dtos/timetable-response.dto';
import { BulkCreateTimetableEntryInput, CreateTimetableEntryInput, SingleEntryInput } from '../dtos/create-timetable-entry.input';
import { GradeInfo, TimetableData } from '../dtos/timetable_response.dto';
import { UpdateTimetableBreakInput } from '../dtos/update-timetable-break.input';
import { User } from 'src/admin/users/entities/user.entity';

@Injectable()
export class TimetableService {
  constructor(
    @InjectRepository(TimeSlot)
    private timeSlotRepo: Repository<TimeSlot>,
    @InjectRepository(TimetableBreak)
    private breakRepo: Repository<TimetableBreak>,
    @InjectRepository(TimetableEntry)
    private entryRepo: Repository<TimetableEntry>,
    private readonly dataSource: DataSource,
  ) {}

  // ========== TIME SLOTS ==========
  async createTimeSlot(
    user: ActiveUserData,
    input: CreateTimeSlotInput,
  ): Promise<TimeSlot> {
    const existing = await this.timeSlotRepo.findOne({
      where: { tenantId: user.tenantId, periodNumber: input.periodNumber },
    });

    if (existing) {
      throw new ConflictException(
        `Time slot for period ${input.periodNumber} already exists`,
      );
    }

    const timeSlot = this.timeSlotRepo.create({
      ...input,
      tenantId: user.tenantId,
    });

    return this.timeSlotRepo.save(timeSlot);
  }

  // async getTimeSlots(user: ActiveUserData): Promise<TimeSlot[]> {
  //   return this.timeSlotRepo.find({
  //     where: { tenantId: user.tenantId, isActive: true },
  //     order: { periodNumber: 'ASC' },
  //   });
  // }

  async getTimeSlots(
  user: ActiveUserData,
  dayOfWeek?: number
): Promise<TimeSlot[]> {
  const slots = await this.timeSlotRepo.find({
    where: { tenantId: user.tenantId, isActive: true },
    order: { periodNumber: 'ASC' }
  });

  if (slots.length === 0) {
    return [];
  }

  const breaks = await this.getBreaks(user, dayOfWeek);
  
  return this.calculateActualTimes(slots, breaks, dayOfWeek);
}

private calculateActualTimes(
  slots: TimeSlot[],
  breaks: TimetableBreak[],
  dayOfWeek?: number
): TimeSlot[] {
  // Find the first period to determine school start time and duration
  const firstPeriod = slots[0];
  
  // Calculate period duration from the first period
  const schoolStartTime = firstPeriod.startTime;
  const periodDuration = this.calculateDuration(
    firstPeriod.startTime,
    firstPeriod.endTime
  );
  
  let currentTime = this.parseTime(schoolStartTime);
  
  return slots.map(slot => {
    const startTime = this.formatTime(currentTime);
    currentTime += periodDuration;
    const endTime = this.formatTime(currentTime);
    
    // Check for breaks
    const breakAfter = breaks.find(b => 
      b.afterPeriod === slot.periodNumber &&
      (b.dayOfWeek === 0 || b.dayOfWeek === dayOfWeek)
    );
    
    if (breakAfter) {
      currentTime += breakAfter.durationMinutes;
    }
    
    return {
      ...slot,
      startTime,
      endTime,
      displayTime: `${this.format12Hour(startTime)} – ${this.format12Hour(endTime)}`
    };
  });
}

private calculateDuration(startTime: string, endTime: string): number {
  const start = this.parseTime(startTime);
  const end = this.parseTime(endTime);
  return end - start;
}

private parseTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

private formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

private format12Hour(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

  async updateTimeSlot(
    id: string,
    user: ActiveUserData,
    input: UpdateTimeSlotInput,
  ): Promise<TimeSlot> {
    const timeSlot = await this.timeSlotRepo.findOne({
      where: { id, tenantId: user.tenantId },
    });

    if (!timeSlot) {
      throw new NotFoundException('Time slot not found');
    }

    Object.assign(timeSlot, input);
    return this.timeSlotRepo.save(timeSlot);
  }

//   async updateTimeSlot(user: ActiveUserData, input: UpdateTimeSlotInput): Promise<TimeSlot> {
//     const timeSlot = await this.timeSlotRepo.findOne({
//       where: { id: input.id, tenantId: user.tenantId },
//     });
  
//     if (!timeSlot) throw new NotFoundException('Time slot not found');
  
//     if (input.periodNumber && input.periodNumber !== timeSlot.periodNumber) {
//       const conflict = await this.timeSlotRepo.findOne({
//         where: { tenantId: user.tenantId, periodNumber: input.periodNumber },
//       });
//       if (conflict) throw new ConflictException(`Time slot for period ${input.periodNumber} already exists`);
//     }
  
//     Object.assign(timeSlot, input);
//     return this.timeSlotRepo.save(timeSlot);
//   }

  async deleteTimeSlot(id: string, user: ActiveUserData): Promise<boolean> {
    const result = await this.timeSlotRepo.delete({ id, tenantId: user.tenantId });
    return (result.affected ?? 0) > 0;
  }

  async deleteAllTimeSlots(user: ActiveUserData): Promise<boolean> {
  // Delete all entries that reference timeslots
  await this.entryRepo.delete({
    tenantId: user.tenantId,
  });

  // Now delete the timeslots
  const result = await this.timeSlotRepo.delete({
    tenantId: user.tenantId,
  });

  return (result.affected ?? 0) > 0;
}



  // ========== BREAKS ==========
  async createBreak(
    user: ActiveUserData,
    input: CreateTimetableBreakInput,
  ): Promise<TimetableBreak> {
    const existingBreak = await this.breakRepo.findOne({
      where: {
        tenantId: user.tenantId,
        dayOfWeek: input.dayOfWeek,
        afterPeriod: input.afterPeriod,
      },
    });
  
    if (existingBreak) {
      throw new ConflictException(
        `A break already exists after period ${input.afterPeriod} for day ${
          input.dayOfWeek === 0 ? 'all days' : input.dayOfWeek
        }`,
      );
    }
  
    const breakEntity = this.breakRepo.create({
      ...input,
      tenantId: user.tenantId,
    });
  
    return this.breakRepo.save(breakEntity);
  }



  

  async getBreaks(user: ActiveUserData, dayOfWeek?: number): Promise<TimetableBreak[]> {
    const where: any = { tenantId: user.tenantId, isActive: true };
    if (dayOfWeek !== undefined) {
      where.dayOfWeek = dayOfWeek;
    }

    return this.breakRepo.find({
      where,
      order: { dayOfWeek: 'ASC', afterPeriod: 'ASC' },
    });
  }

  async updateBreak(user: ActiveUserData, input: UpdateTimetableBreakInput): Promise<TimetableBreak> {
    const breakEntity = await this.breakRepo.findOne({
      where: { id: input.id, tenantId: user.tenantId },
    });
  
    if (!breakEntity) throw new NotFoundException('Break not found');
  
    if ((input.dayOfWeek && input.afterPeriod) &&
        (input.dayOfWeek !== breakEntity.dayOfWeek || input.afterPeriod !== breakEntity.afterPeriod)) {
      const conflict = await this.breakRepo.findOne({
        where: { tenantId: user.tenantId, dayOfWeek: input.dayOfWeek, afterPeriod: input.afterPeriod },
      });
      if (conflict) throw new ConflictException(
        `A break already exists after period ${input.afterPeriod} for day ${input.dayOfWeek}`,
      );
    }
  
    Object.assign(breakEntity, input);
    return this.breakRepo.save(breakEntity);
  }

  async deleteBreak(id: string, user: ActiveUserData): Promise<boolean> {
    const result = await this.breakRepo.delete({ id, tenantId: user.tenantId });
    return (result.affected ?? 0) > 0;
  }



  async deleteAllBreaks(user: ActiveUserData): Promise<boolean> {
  const result = await this.breakRepo.delete({
    tenantId: user.tenantId,
  });

  return (result.affected ?? 0) > 0;
}




  // ========== TIMETABLE ENTRIES ==========
  // async createEntry(
  //   user: ActiveUserData,
  //   input: CreateTimetableEntryInput,
  // ): Promise<TimetableEntry> {
  //   const termRepo = this.dataSource.getRepository('Term');
  //   const gradeRepo = this.dataSource.getRepository('TenantGradeLevel');
  //   const subjectRepo = this.dataSource.getRepository('TenantSubject');
  //   const teacherRepo = this.dataSource.getRepository('Teacher');
  //   const timeSlotRepo = this.dataSource.getRepository('TimeSlot');
  
  //   const [term, grade, subject, teacher, timeSlot] = await Promise.all([
  //     termRepo.findOne({ where: { id: input.termId, tenantId: user.tenantId } }),
  //     gradeRepo.findOne({ where: { id: input.gradeId, tenant: { id: user.tenantId } } }),
  //     subjectRepo.findOne({ where: { id: input.subjectId, tenant: { id: user.tenantId } } }),
  //     teacherRepo.findOne({ where: { id: input.teacherId, tenant: { id: user.tenantId } } }),
  //     timeSlotRepo.findOne({ where: { id: input.timeSlotId, tenant: { id: user.tenantId } } }),
  //   ]);
  
  //   if (!term || !grade || !subject || !teacher || !timeSlot) {
  //     throw new BadRequestException('One or more IDs are invalid for your tenant');
  //   }
  
  //   // Prevent duplicate slot for same grade/day/time
  //   const existing = await this.entryRepo.findOne({
  //     where: {
  //       tenantId: user.tenantId,
  //       term: { id: term.id },
  //       grade: { id: grade.id },
  //       dayOfWeek: input.dayOfWeek,
  //       timeSlot: { id: timeSlot.id },
  //     },
  //   });
  
  //   if (existing) {
  //     throw new ConflictException(
  //       'A class is already scheduled for this grade at this time',
  //     );
  //   }
  
  //   // ✅ Attach relations properly
  //   const entry = this.entryRepo.create({
  //       tenantId: user.tenantId,
  //       dayOfWeek: input.dayOfWeek,
  //       roomNumber: input.roomNumber,
  //       term: term,           
  //       grade: grade,         
  //       subject: subject,     
  //       teacher: teacher,     
  //       timeSlot: timeSlot,   
        
  //     });
    
  //     return await this.entryRepo.save(entry);
  // }
  

  async createEntry(
  user: ActiveUserData,
  input: CreateTimetableEntryInput,
): Promise<TimetableEntry> {
  const termRepo = this.dataSource.getRepository('Term');
  const gradeRepo = this.dataSource.getRepository('TenantGradeLevel');
  const subjectRepo = this.dataSource.getRepository('TenantSubject');
  const teacherRepo = this.dataSource.getRepository('Teacher');
  const timeSlotRepo = this.dataSource.getRepository('TimeSlot');

  // Fetch all relations in parallel
  const [term, grade, subject, teacher, timeSlot] = await Promise.all([
    termRepo.findOne({
      where: { id: input.termId, tenantId: user.tenantId },
    }),
    gradeRepo.findOne({
      where: { id: input.gradeId, tenant: { id: user.tenantId } },
    }),
    subjectRepo.findOne({
      where: { id: input.subjectId, tenant: { id: user.tenantId } },
    }),
    teacherRepo.findOne({
      where: { id: input.teacherId, tenant: { id: user.tenantId } },
    }),
    timeSlotRepo.findOne({
      where: { id: input.timeSlotId, tenant: { id: user.tenantId } },
    }),
  ]);

  // One-by-one validation — clear, explicit errors
  if (!term) {
    throw new BadRequestException(`Invalid termId: ${input.termId}`);
  }
  if (!grade) {
    throw new BadRequestException(`Invalid gradeId: ${input.gradeId}`);
  }
  if (!subject) {
    throw new BadRequestException(`Invalid subjectId: ${input.subjectId}`);
  }
  if (!teacher) {
    throw new BadRequestException(`Invalid teacherId: ${input.teacherId}`);
  }
  if (!timeSlot) {
    throw new BadRequestException(`Invalid timeSlotId: ${input.timeSlotId}`);
  }

  // Prevent duplicate timetable entry for the same (grade + day + time + term)
  const existing = await this.entryRepo.findOne({
    where: {
      tenantId: user.tenantId,
      term: { id: term.id },
      grade: { id: grade.id },
      dayOfWeek: input.dayOfWeek,
      timeSlot: { id: timeSlot.id },
    },
  });

  if (existing) {
    throw new ConflictException(
      'A class is already scheduled for this grade at this time',
    );
  }

  // Create the entry with proper relations
  const entry = this.entryRepo.create({
    tenantId: user.tenantId,
    dayOfWeek: input.dayOfWeek,
    roomNumber: input.roomNumber,

    term,
    grade,
    subject,
    teacher,
    timeSlot,
  });

  return await this.entryRepo.save(entry);
}


async getWholeSchoolTimetable(
  user: ActiveUserData,
  termId: string,
): Promise<TimetableData> {
  const gradeRepo = this.dataSource.getRepository('TenantGradeLevel');

  // Fetch all components in parallel
  const [timeSlots, breaks, entries, grades] = await Promise.all([
    this.getTimeSlots(user),
    this.getBreaks(user),
    this.entryRepo.find({
      where: { tenantId: user.tenantId, termId, isActive: true },
      order: { dayOfWeek: 'ASC' },
      relations: [
        'grade',
        'grade.gradeLevel',
        'subject',
        'teacher',
        'teacher.user', 
        'timeSlot',
      ],
    }),
    gradeRepo.find({
      where: { tenant: { id: user.tenantId }, isActive: true },
      order: { sortOrder: 'ASC' },
    }),
  ]);

  // Transform grades for frontend
  const gradeInfos: GradeInfo[] = grades.map((g, index) => ({
    id: g.id,
    name: g.gradeLevel?.name || g.name || `Grade ${index + 1}`,
    displayName: g.shortName || g.gradeLevel?.name || g.name || `G${index + 1}`,
    level: g.sortOrder || index + 1,
  }));

  return {
    timeSlots,
    breaks,
    entries,
    grades: gradeInfos,
    lastUpdated: new Date().toISOString(),
  };
}

  


   async bulkCreateEntries(
    user: ActiveUserData,
    input: BulkCreateTimetableEntryInput,
  ): Promise<TimetableEntry[]> {
    const termRepo = this.dataSource.getRepository('Term');
    const gradeRepo = this.dataSource.getRepository('TenantGradeLevel');
    const subjectRepo = this.dataSource.getRepository('TenantSubject');
    const teacherRepo = this.dataSource.getRepository('Teacher');
    const timeSlotRepo = this.dataSource.getRepository('TimeSlot');
    const entryRepo = this.dataSource.getRepository('TimetableEntry');

    // Basic checks
    if (!Array.isArray(input.entries) || input.entries.length === 0) {
      throw new BadRequestException('entries must be a non-empty array');
    }

    // Validate term & grade (tenant-scoped)
    const [term, grade] = await Promise.all([
      termRepo.findOne({ where: { id: input.termId, tenantId: user.tenantId } }),
      gradeRepo.findOne({ where: { id: input.gradeId, tenant: { id: user.tenantId } } }),
    ]);

    if (!term) {
      throw new BadRequestException(`Invalid termId: ${input.termId}`);
    }
    if (!grade) {
      throw new BadRequestException(`Invalid gradeId: ${input.gradeId}`);
    }

    // Collect unique ids from payload
    const subjectIds = Array.from(new Set(input.entries.map((e) => e.subjectId)));
    const teacherIds = Array.from(new Set(input.entries.map((e) => e.teacherId)));
    const timeSlotIds = Array.from(new Set(input.entries.map((e) => e.timeSlotId)));

    // Fetch referenced entities (tenant-scoped)
    const [subjects, teachers, timeSlots] = await Promise.all([
      subjectRepo.find({ where: { id: In(subjectIds), tenant: { id: user.tenantId } } }),
      teacherRepo.find({ where: { id: In(teacherIds), tenant: { id: user.tenantId } } }),
      timeSlotRepo.find({ where: { id: In(timeSlotIds), tenant: { id: user.tenantId } } }),
    ]);

    const subjectMap = new Map(subjects.map((s: any) => [s.id, s]));
    const teacherMap = new Map(teachers.map((t: any) => [t.id, t]));
    const timeSlotMap = new Map(timeSlots.map((ts: any) => [ts.id, ts]));

    // Per-entry validation & batch-duplicate detection
    const errors: string[] = [];
    const batchKeys = new Set<string>(); // key = `${dayOfWeek}:${timeSlotId}`
    const batchEntriesToCreate: { input: SingleEntryInput; idx: number; key: string }[] = [];

    input.entries.forEach((entry, idx) => {
      // Validate UUID presence (you already have class-validator on DTOs, but double-check here for clarity)
      if (!entry.subjectId) errors.push(`Entry ${idx}: missing subjectId`);
      if (!entry.teacherId) errors.push(`Entry ${idx}: missing teacherId`);
      if (!entry.timeSlotId) errors.push(`Entry ${idx}: missing timeSlotId`);

      // Existence checks (tenant-scoped lookups done above)
      if (entry.subjectId && !subjectMap.has(entry.subjectId)) {
        errors.push(`Entry ${idx}: Invalid subjectId: ${entry.subjectId}`);
      }
      if (entry.teacherId && !teacherMap.has(entry.teacherId)) {
        errors.push(`Entry ${idx}: Invalid teacherId: ${entry.teacherId}`);
      }
      if (entry.timeSlotId && !timeSlotMap.has(entry.timeSlotId)) {
        errors.push(`Entry ${idx}: Invalid timeSlotId: ${entry.timeSlotId}`);
      }

      // dayOfWeek validation (should match your DTO: 1..5)
      if (typeof entry.dayOfWeek !== 'number') {
      // if (typeof entry.dayOfWeek !== 'number' || entry.dayOfWeek < 1 || entry.dayOfWeek > 7) {

        errors.push(`Entry ${idx}: dayOfWeek must be an integer (1-7). Got: ${entry.dayOfWeek}`);
      }

      const key = `${entry.dayOfWeek}:${entry.timeSlotId}`;
      if (batchKeys.has(key)) {
        errors.push(`Entry ${idx}: duplicate slot in the provided batch (day ${entry.dayOfWeek}, timeSlot ${entry.timeSlotId})`);
      } else {
        batchKeys.add(key);
        batchEntriesToCreate.push({ input: entry, idx, key });
      }
    });

    if (errors.length > 0) {
      throw new BadRequestException({ message: 'Validation failed', details: errors });
    }

    // Check for conflicts with existing DB entries for same tenant/term/grade
    // We query all existing entries for this tenant + term + grade where dayOfWeek/timeSlot intersects with our batch
    const days = Array.from(new Set(input.entries.map((e) => e.dayOfWeek)));
    const timeSlotIdsInBatch = Array.from(batchKeys).map(k => k.split(':')[1]);
    const existingEntries = await entryRepo.find({
      where: {
        tenantId: user.tenantId,
        term: { id: term.id },
        grade: { id: grade.id },
        dayOfWeek: In(days),
        timeSlot: { id: In(timeSlotIdsInBatch) },
      },
      relations: ['timeSlot'],
    });

    // Build existing key set
    const existingKeys = new Set(existingEntries.map((ex: any) => `${ex.dayOfWeek}:${ex.timeSlot.id}`));
    const conflictErrors: string[] = [];
    batchEntriesToCreate.forEach(({ input: e, idx }) => {
      const k = `${e.dayOfWeek}:${e.timeSlotId}`;
      if (existingKeys.has(k)) {
        conflictErrors.push(`Entry ${idx}: conflict with existing timetable for day ${e.dayOfWeek}, timeSlot ${e.timeSlotId}`);
      }
    });

    if (conflictErrors.length > 0) {
      throw new ConflictException({ message: 'Some entries conflict with existing timetable', details: conflictErrors });
    }

    // All validation passed — create entries inside a transaction
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const toSave: any[] = [];

      for (const { input: e } of batchEntriesToCreate) {
        const ent = entryRepo.create({
          tenantId: user.tenantId,
          dayOfWeek: e.dayOfWeek,
          roomNumber: e.roomNumber ?? null,
          term: term,
          grade: grade,
          subject: subjectMap.get(e.subjectId),
          teacher: teacherMap.get(e.teacherId),
          timeSlot: timeSlotMap.get(e.timeSlotId),
        });
        toSave.push(ent);
      }

      // Use the transaction manager to save
      const saved = await queryRunner.manager.save(toSave);

      await queryRunner.commitTransaction();

      return saved;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      // rethrow — keep original error if possible
      throw err;
    } finally {
      await queryRunner.release();
    }
  }


  async getEntriesForGrade(
    user: ActiveUserData,
    termId: string,
    gradeId: string,
  ): Promise<TimetableEntry[]> {
    return this.entryRepo.find({
      where: { tenantId: user.tenantId, termId, gradeId, isActive: true },
      order: { dayOfWeek: 'ASC', timeSlotId: 'ASC' },
    });
  }

  async getTeacherSchedule(
    user: ActiveUserData,
    termId: string,
    teacherId: string,
  ): Promise<TimetableEntry[]> {
    return this.entryRepo.find({
      where: { tenantId: user.tenantId, termId, teacherId, isActive: true },
      order: { dayOfWeek: 'ASC', timeSlotId: 'ASC' },
    });
  }

  async updateEntry(
    id: string,
    user: ActiveUserData,
    input: Partial<CreateTimetableEntryInput>,
  ): Promise<TimetableEntry> {
    const entry = await this.entryRepo.findOne({
      where: { id, tenantId: user.tenantId },
    });

    if (!entry) {
      throw new NotFoundException('Timetable entry not found');
    }

    Object.assign(entry, input);
    return this.entryRepo.save(entry);
  }

  async deleteEntry(id: string, user: ActiveUserData): Promise<boolean> {
    const result = await this.entryRepo.delete({ id, tenantId: user.tenantId });
    return (result.affected ?? 0) > 0;
  }



  async getCompleteTimetable(
    user: ActiveUserData,
    termId: string,
    gradeId: string,
  ): Promise<GradeTimetableResponse> {
    const tenantId = user.tenantId;
    
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }
    const gradeLevelRepo = this.dataSource.getRepository('TenantGradeLevel');

    const [timeSlots, breaks, entries, grade] = await Promise.all([
      this.getTimeSlots(user),
      this.getBreaks(user),
      this.getEntriesForGrade(user, termId, gradeId),
      // Fetch grade details - adjust based on your repository
      gradeLevelRepo.findOne({ where: { id: gradeId } }),
    ]);

    // Build cells matrix
    const cells: TimetableCell[] = [];

    for (let day = 1; day <= 5; day++) {
      for (const timeSlot of timeSlots) {
        // Check if there's a break after this period
        const breakAfter = breaks.find(
          (b) =>
            (b.dayOfWeek === day || b.dayOfWeek === 0) &&
            b.afterPeriod === timeSlot.periodNumber,
        );

        if (breakAfter) {
          cells.push({
            dayOfWeek: day,
            periodNumber: timeSlot.periodNumber,
            isBreak: true,
            breakData: breakAfter,
            entryData: undefined
          });
        }

        // Find the actual entry
        const entry = entries.find(
          (e) =>
            e.dayOfWeek === day && e.timeSlot.periodNumber === timeSlot.periodNumber,
        );

        cells.push({
          dayOfWeek: day,
          periodNumber: timeSlot.periodNumber,
          isBreak: false,
          breakData: undefined,
          entryData: entry || undefined,
        });
      }
    }
    

    return {
      gradeId,
      gradeName: grade?.name || 'Unknown',
      timeSlots,
      cells,
    };
  }





  async getTeacherTimetableData(
    user: ActiveUserData,
    termId: string,
    teacherId: string,
  ): Promise<TimetableData> {
    const gradeRepo = this.dataSource.getRepository('TenantGradeLevel');
    const [timeSlots, breaks, entries, grades] = await Promise.all([
      this.getTimeSlots(user),
      this.getBreaks(user),
      this.entryRepo.find({
        where: { tenantId: user.tenantId, termId, teacherId, isActive: true },
        order: { dayOfWeek: 'ASC' },
      }),
      gradeRepo.find({
        where: { tenant: { id: user.tenantId }, isActive: true },
        order: { sortOrder: 'ASC' },
      }),
    ]);

    const gradeInfos: GradeInfo[] = grades.map((g, index) => ({
      id: g.id,
      name: g.gradeLevel?.name || g.name || `Grade ${index + 1}`,
      displayName: g.shortName || g.gradeLevel?.name || g.name || `G${index + 1}`,
      level: g.sortOrder || index + 1,
    }));

    return {
      timeSlots,
      breaks,
      entries, 
      grades: gradeInfos,
      lastUpdated: new Date().toISOString(),
    };
  }

  // Get teacher's weekly schedule summary
  async getTeacherWeeklySummary(
    user: ActiveUserData,
    termId: string,
    teacherId: string,
  ): Promise<{
    totalClasses: number;
    classesByDay: Record<number, number>;
    classesByGrade: Record<string, number>;
    classesBySubject: Record<string, number>;
    entries: TimetableEntry[];
  }> {
    const entries = await this.getTeacherSchedule(user, termId, teacherId);

    const classesByDay: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const classesByGrade: Record<string, number> = {};
    const classesBySubject: Record<string, number> = {};

    entries.forEach((entry) => {
      classesByDay[entry.dayOfWeek]++;
      
      const gradeName = entry.grade?.name || 'Unknown';
      classesByGrade[gradeName] = (classesByGrade[gradeName] || 0) + 1;
      
      const subjectName = entry.subject?.name || 'Unknown';
      classesBySubject[subjectName] = (classesBySubject[subjectName] || 0) + 1;
    });

    return {
      totalClasses: entries.length,
      classesByDay,
      classesByGrade,
      classesBySubject,
      entries,
    };
  }

  // Check if teacher is available at a specific time
  async isTeacherAvailable(
    tenantId: string,
    termId: string,
    teacherId: string,
    dayOfWeek: number,
    timeSlotId: string,
  ): Promise<boolean> {
    const existing = await this.entryRepo.findOne({
      where: {
        tenantId,
        termId,
        teacherId,
        dayOfWeek,
        timeSlotId,
        isActive: true,
      },
    });

    return !existing; // Available if no entry found
  }

  // Get all teachers with their teaching load for a term
  async getAllTeachersWithLoad(
    user: ActiveUserData,
    termId: string,
  ): Promise<Array<{
    teacherId: string;
    teacherName: string;
    totalClasses: number;
    subjects: string[];
    grades: string[];
  }>> {
    const entries = await this.entryRepo.find({
      where: { tenantId: user.tenantId, termId, isActive: true },
    });

    const teacherMap = new Map<string, {
      teacherId: string;
      teacherName: string;
      totalClasses: number;
      subjects: Set<string>;
      grades: Set<string>;
    }>();

    entries.forEach((entry) => {
      const teacherId = entry.teacherId;
      const teacherName = entry.teacher.fullName || 'Unknown';
      
      if (!teacherMap.has(teacherId)) {
        teacherMap.set(teacherId, {
          teacherId,
          teacherName,
          totalClasses: 0,
          subjects: new Set(),
          grades: new Set(),
        });
      }

      const data = teacherMap.get(teacherId)!;
      data.totalClasses++;
      data.subjects.add(entry.subject?.name || 'Unknown');
      data.grades.add(entry.grade?.name || 'Unknown');
    });

    return Array.from(teacherMap.values()).map((data) => ({
      teacherId: data.teacherId,
      teacherName: data.teacherName,
      totalClasses: data.totalClasses,
      subjects: Array.from(data.subjects),
      grades: Array.from(data.grades),
    }));
  }

  // Get teacher conflicts (same time, different classes)
  async getTeacherConflicts(
    user: ActiveUserData,
    termId: string,
  ): Promise<Array<{
    teacherId: string;
    teacherName: string;
    dayOfWeek: number;
    timeSlotId: string;
    conflictingEntries: TimetableEntry[];
  }>> {
    const entries = await this.entryRepo.find({
      where: { tenantId: user.tenantId, termId, isActive: true },
    });

    const conflicts: Array<{
      teacherId: string;
      teacherName: string;
      dayOfWeek: number;
      timeSlotId: string;
      conflictingEntries: TimetableEntry[];
    }> = [];

    // Group by teacher + day + timeSlot
    const groupKey = (entry: TimetableEntry) =>
      `${entry.teacherId}-${entry.dayOfWeek}-${entry.timeSlotId}`;

    const grouped = new Map<string, TimetableEntry[]>();
    entries.forEach((entry) => {
      const key = groupKey(entry);
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(entry);
    });

    // Find conflicts (more than 1 class at same time)
    grouped.forEach((entries, key) => {
      if (entries.length > 1) {
        const [teacherId, dayOfWeek, timeSlotId] = key.split('-');
        conflicts.push({
          teacherId,
          teacherName: entries[0].teacher?.fullName || 'Unknown',
          dayOfWeek: parseInt(dayOfWeek),
          timeSlotId,
          conflictingEntries: entries,
        });
      }
    });

    return conflicts;
  }

  // Helper to get entries for specific grades
  async getMultipleGradeTimetables(
    user: ActiveUserData,
    termId: string,
    gradeIds: string[],
  ): Promise<TimetableEntry[]> {
    return this.entryRepo.find({
      where: {
        tenantId: user.tenantId,
        termId,
        gradeId: In(gradeIds),
        isActive: true,
      },
      order: { dayOfWeek: 'ASC' },
    });
  }



  // timetable.service.ts

async getMyTimetable(
  user: ActiveUserData,
  termId: string,
): Promise<TimetableData> {
  if (!user.tenantId) {
    throw new BadRequestException('Tenant ID is required');
  }

  // Get all grades the user teaches (or has access to)
  const gradeRepo = this.dataSource.getRepository('TenantGradeLevel');
  const grades = await gradeRepo.find({
    where: { teacherId: user.sub, tenant: { id: user.tenantId }, isActive: true },
    order: { sortOrder: 'ASC' },
  });

  // Fetch all necessary data
  const [timeSlots, breaks, entries] = await Promise.all([
    this.getTimeSlots(user),
    this.getBreaks(user),
    this.entryRepo.find({
      where: { tenantId: user.tenantId, termId, teacherId: user.sub, isActive: true },
      order: { dayOfWeek: 'ASC', timeSlotId: 'ASC' },
    }),
  ]);

  const gradeInfos: GradeInfo[] = grades.map((g, index) => ({
    id: g.id,
    name: g.gradeLevel?.name || g.name || `Grade ${index + 1}`,
    displayName: g.shortName || g.gradeLevel?.name || g.name || `G${index + 1}`,
    level: g.sortOrder || index + 1,
  }));

  return {
    timeSlots,
    breaks,
    entries,
    grades: gradeInfos,
    lastUpdated: new Date().toISOString(),
  };
}


async getMyTimetableAsTeacher(
  user: ActiveUserData,
  termId: string
): Promise<TimetableData> {
  return this.getTeacherTimetableData(user, termId, user.sub);
}


}

// AIzaSyB3QdbcO-mLCQVhg9lA7ygmP53uWH0bM1Q



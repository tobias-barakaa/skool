import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TimeSlot } from '../entities/time_slots.entity';
import { TimetableBreak } from '../entities/timetable_break.entity';
import { TimetableEntry } from '../entities/timetable_entries.entity';
import { CreateTimeSlotInput } from '../dtos/create_time_slot';
import { UpdateTimeSlotInput } from '../dtos/update_time_slot.dto';
import { CreateTimetableBreakInput } from '../dtos/create_timetable_break.dto';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { GradeTimetableResponse, TimetableCell } from '../dtos/timetable-response.dto';
import { BulkCreateTimetableEntryInput, CreateTimetableEntryInput } from '../dtos/create-timetable-entry.input';

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

  async getTimeSlots(user: ActiveUserData): Promise<TimeSlot[]> {
    return this.timeSlotRepo.find({
      where: { tenantId: user.tenantId, isActive: true },
      order: { periodNumber: 'ASC' },
    });
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

  async deleteTimeSlot(id: string, user: ActiveUserData): Promise<boolean> {
    const result = await this.timeSlotRepo.delete({ id, tenantId: user.tenantId });
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

  async deleteBreak(id: string, user: ActiveUserData): Promise<boolean> {
    const result = await this.breakRepo.delete({ id, tenantId: user.tenantId });
    return (result.affected ?? 0) > 0;
  }

  // ========== TIMETABLE ENTRIES ==========
  async createEntry(
    user: ActiveUserData,
    input: CreateTimetableEntryInput,
  ): Promise<TimetableEntry> {
    // Check for conflicts
    const existing = await this.entryRepo.findOne({
      where: {
        tenantId: user.tenantId,
        termId: input.termId,
        gradeId: input.gradeId,
        dayOfWeek: input.dayOfWeek,
        timeSlotId: input.timeSlotId,
      },
    });

    if (existing) {
      throw new ConflictException(
        'A class is already scheduled for this grade at this time',
      );
    }

    const entry = this.entryRepo.create({
      ...input,
      tenantId: user.tenantId,
    });

    return this.entryRepo.save(entry);
  }

  async bulkCreateEntries(
    user: ActiveUserData,
    input: BulkCreateTimetableEntryInput,
  ): Promise<TimetableEntry[]> {
    const entries = input.entries.map((e) =>
      this.entryRepo.create({
        ...e,
        tenantId: user.tenantId,
        termId: input.termId,
        gradeId: input.gradeId,
      }),
    );

    return this.entryRepo.save(entries);
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
}
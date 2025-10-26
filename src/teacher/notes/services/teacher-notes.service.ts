import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeacherNote, NoteVisibility } from '../entities/teacher-note.entity';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { CreateTeacherNoteDto } from '../dtos/create-teacher-note.dto';
import { FilterTeacherNotesDto } from '../dtos/filter-teacher-notes.dto';
import { UpdateTeacherNoteDto } from '../dtos/update-teacher-note.dto';

@Injectable()
export class TeacherNotesService {
  constructor(
    @InjectRepository(TeacherNote)
    private readonly teacherNoteRepository: Repository<TeacherNote>,
  ) {}

  /**
   * Create a new teacher note
   * @param dto - Note creation data
   * @param user - Active user data (teacher)
   * @returns Created note
   */
  async createNote(
    dto: CreateTeacherNoteDto,
    user: ActiveUserData,
  ): Promise<TeacherNote> {
    const note = this.teacherNoteRepository.create({
      ...dto,
      tenant_id: user.tenantId,
      teacher_id: user.sub,
    });
  
    const saved = await this.teacherNoteRepository.save(note);
  
    const reloaded = await this.teacherNoteRepository.findOne({
      where: { id: saved.id },
      relations: ['teacher', 'subject', 'gradeLevel'],
    });
    if (!reloaded) {
      throw new NotFoundException(`Failed to reload created note with ID ${saved.id}`);
    }
    return reloaded;
  }
  

  /**
   * Get all notes created by the logged-in teacher
   * @param user - Active user data (teacher)
   * @param filters - Optional filters
   * @returns List of teacher's notes
   */
  async getMyNotes(
    user: ActiveUserData,
    filters?: FilterTeacherNotesDto,
  ): Promise<TeacherNote[]> {
    const query = this.teacherNoteRepository
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.teacher', 'teacher')
      .leftJoinAndSelect('note.subject', 'subject')
      .leftJoinAndSelect('note.gradeLevel', 'gradeLevel')
      .where('note.tenant_id = :tenantId', { tenantId: user.tenantId })
      .andWhere('note.teacher_id = :teacherId', { teacherId: user.sub })
      .orderBy('note.created_at', 'DESC');
  
    if (filters?.subject_id) {
      query.andWhere('note.subject_id = :subjectId', { subjectId: filters.subject_id });
    }
  
    if (filters?.grade_level_id) {
      query.andWhere('note.grade_level_id = :gradeLevelId', {
        gradeLevelId: filters.grade_level_id,
      });
    }
  
    if (filters?.visibility) {
      query.andWhere('note.visibility = :visibility', { visibility: filters.visibility });
    }
  
    if (filters?.is_ai_generated !== undefined) {
      query.andWhere('note.is_ai_generated = :isAiGenerated', {
        isAiGenerated: filters.is_ai_generated,
      });
    }
  
    return await query.getMany();
  }
  

  /**
   * Get a specific note by ID (must be owned by teacher)
   * @param id - Note ID
   * @param user - Active user data (teacher)
   * @returns Note details
   */
  async getNoteById(id: string, user: ActiveUserData): Promise<TeacherNote> {
    const note = await this.teacherNoteRepository.findOne({
      where: {
        id,
        tenant_id: user.tenantId,
        teacher_id: user.sub,
      },
    });

    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found or you don't have access to it`);
    }

    return note;
  }

  /**
   * Update a teacher note
   * @param dto - Update data with note ID
   * @param user - Active user data (teacher)
   * @returns Updated note
   */
  async updateNote(
    dto: UpdateTeacherNoteDto,
    user: ActiveUserData,
  ): Promise<TeacherNote> {
    const note = await this.getNoteById(dto.id, user);

    Object.assign(note, dto);
    return await this.teacherNoteRepository.save(note);
  }

  /**
   * Delete a teacher note
   * @param id - Note ID
   * @param user - Active user data (teacher)
   * @returns Success status
   */
  async deleteNote(id: string, user: ActiveUserData): Promise<boolean> {
    const note = await this.getNoteById(id, user);
    
    await this.teacherNoteRepository.remove(note);
    return true;
  }

  /**
   * Get notes shared with the school (for teacher's reference)
   * @param user - Active user data (teacher)
   * @returns List of school-wide notes
   */
  async getSchoolNotes(user: ActiveUserData): Promise<TeacherNote[]> {
    return await this.teacherNoteRepository.find({
      where: {
        tenant_id: user.tenantId,
        visibility: NoteVisibility.SCHOOL,
      },
      order: {
        created_at: 'DESC',
      },
    });
  }


   async getSchoolNotesGrade(user: ActiveUserData): Promise<TeacherNote[]> {
    return await this.teacherNoteRepository.find({
      where: {
        tenant_id: user.tenantId,
        visibility: NoteVisibility.GRADE,
      },
      order: {
        created_at: 'DESC',
      },
    });
  }
}





    


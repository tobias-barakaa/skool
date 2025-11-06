import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeacherNote, NoteVisibility } from 'src/teacher/notes/entities/teacher-note.entity';
import { Student } from 'src/admin/student/entities/student.entity';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { FilterTeacherNotesDto } from 'src/teacher/notes/dtos/filter-teacher-notes.dto';

@Injectable()
export class StudentNotesService {
  constructor(
    @InjectRepository(TeacherNote)
    private readonly teacherNoteRepository: Repository<TeacherNote>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  /**
   * Get student record by user ID
   * @param userId - User ID
   * @param tenantId - Tenant ID
   * @returns Student record
   */
  private async getStudentByUserId(
    userId: string,
    user: ActiveUserData,
  ): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: {
        user_id: userId,
        tenant_id: user.tenantId,
      },
      relations: ['grade'],
    });

    if (!student) {
      throw new Error('Student record not found');
    }

    return student;
  }

  /**
   * Get all notes accessible to a student based on their grade level
   * Students can see:
   * - Notes with SCHOOL visibility (all students)
   * - Notes with GRADE visibility matching their grade level
   * @param user - Active user data (student)
   * @param filters - Optional filters
   * @returns List of accessible notes
   */
  async getAccessibleNotes(
    user: ActiveUserData,
    filters?: FilterTeacherNotesDto,
  ): Promise<TeacherNote[]> {
    const student = await this.getStudentByUserId(user.sub, user);
  
    const query = this.teacherNoteRepository
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.teacher', 'teacher')
      .leftJoinAndSelect('note.subject', 'subject')
      .leftJoinAndSelect('note.gradeLevel', 'gradeLevel')
      .where('note.tenant_id = :tenantId', { tenantId: user.tenantId })
      .andWhere(
        '(note.visibility = :schoolVisibility OR ' +
        '(note.visibility = :gradeVisibility AND note.grade_level_id = :gradeLevelId))',
        {
          schoolVisibility: NoteVisibility.SCHOOL,
          gradeVisibility: NoteVisibility.GRADE,
          gradeLevelId: student.grade.id,
        },
      )
      .orderBy('note.created_at', 'DESC');
  
    if (filters?.subject_id) {
      query.andWhere('note.subject_id = :subjectId', { subjectId: filters.subject_id });
    }
  
    if (filters?.grade_level_id) {
      query.andWhere('note.grade_level_id = :gradeLevelId', {
        gradeLevelId: filters.grade_level_id,
      });
    }
  
    if (filters?.is_ai_generated !== undefined) {
      query.andWhere('note.is_ai_generated = :isAiGenerated', {
        isAiGenerated: filters.is_ai_generated,
      });
    }
  
    return await query.getMany();
  }
  
  /**
   * Get notes by subject for a student
   * @param user - Active user data (student)
   * @param subjectId - Subject ID
   * @returns List of notes for the subject
   */
  async getNotesBySubject(
    user: ActiveUserData,
    subjectId: string,
  ): Promise<TeacherNote[]> {
    const student = await this.getStudentByUserId(user.sub, user);

  return await this.teacherNoteRepository
  .createQueryBuilder('note')
  .leftJoinAndSelect('note.teacher', 'teacher')
  .leftJoinAndSelect('note.subject', 'subject')
  .leftJoinAndSelect('note.gradeLevel', 'gradeLevel')
  .where('note.tenant_id = :tenantId', { tenantId: user.tenantId })
  .andWhere('note.subject_id = :subjectId', { subjectId })
  .andWhere(
    '(note.visibility = :schoolVisibility OR ' +
    '(note.visibility = :gradeVisibility AND note.grade_level_id = :gradeLevelId))',
    {
      schoolVisibility: NoteVisibility.SCHOOL,
      gradeVisibility: NoteVisibility.GRADE,
      gradeLevelId: student.grade.id,
    },
  )
  .orderBy('note.created_at', 'DESC')
  .getMany();

}
  /**
   * Get notes for student's grade level
   * @param user - Active user data (student)
   * @returns List of grade-specific notes
   */
  async getGradeNotes(user: ActiveUserData): Promise<TeacherNote[]> {
    const student = await this.getStudentByUserId(user.sub, user);

    return await this.teacherNoteRepository.find({
      where: {
        tenant_id: user.tenantId,
        grade_level_id: student.grade.id,
        visibility: NoteVisibility.GRADE,
      },
      order: {
        created_at: 'DESC',
      },
    });
  }

  /**
   * Get school-wide notes
   * @param user - Active user data (student)
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

  /**
   * Get a specific note by ID (if student has access)
   * @param id - Note ID
   * @param user - Active user data (student)
   * @returns Note details
   */
  async getNoteById(id: string, user: ActiveUserData): Promise<TeacherNote> {
    const student = await this.getStudentByUserId(user.sub, user);

    const note = await this.teacherNoteRepository
      .createQueryBuilder('note')
  .leftJoinAndSelect('note.teacher', 'teacher')
  .leftJoinAndSelect('note.subject', 'subject')
  .leftJoinAndSelect('note.gradeLevel', 'gradeLevel')

      .where('note.id = :id', { id })
      .andWhere('note.tenant_id = :tenantId', { tenantId: user.tenantId })
      .andWhere(
        '(note.visibility = :schoolVisibility OR ' +
        '(note.visibility = :gradeVisibility AND note.grade_level_id = :gradeLevelId))',
        {
          schoolVisibility: NoteVisibility.SCHOOL,
          gradeVisibility: NoteVisibility.GRADE,
          gradeLevelId: student.grade.id,
        },
      )
      .getOne();

    if (!note) {
      throw new Error(`Note with ID ${id} not found or you don't have access to it`);
    }

    return note;
  }
}




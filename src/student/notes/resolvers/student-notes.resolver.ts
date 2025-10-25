import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { MembershipRole, UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { Roles } from 'src/iam/decorators/roles.decorator';
import { CreateTeacherNoteDto } from 'src/teacher/notes/dtos/create-teacher-note.dto';
import { FilterTeacherNotesDto } from 'src/teacher/notes/dtos/filter-teacher-notes.dto';
import { UpdateTeacherNoteDto } from 'src/teacher/notes/dtos/update-teacher-note.dto';
import { TeacherNote } from 'src/teacher/notes/entities/teacher-note.entity';
import { TeacherNotesService } from 'src/teacher/notes/services/teacher-notes.service';
import { StudentNotesService } from '../services/student-notes.service';


@Resolver(() => TeacherNote)
@Roles(MembershipRole.TEACHER, MembershipRole.SCHOOL_ADMIN)
export class StudentNotesResolver {
  constructor(private readonly studentNotesService: StudentNotesService) {}

  /**
   * Get all notes accessible to the student
   * Students can view notes with SCHOOL visibility or GRADE visibility matching their grade
   * @query getStudentAccessibleNotes
   * @param {FilterTeacherNotesDto} filters - Optional filters
   * @returns {TeacherNote[]} List of accessible notes
   * 
   * @example
   * query {
   *   getStudentAccessibleNotes(filters: {
   *     subject_id: "uuid-here"
   *   }) {
   *     id
   *     title
   *     content
   *     links
   *     visibility
   *     teacher { first_name last_name }
   *     subject { name }
   *     gradeLevel { name }
   *     created_at
   *   }
   * }
   */
  @Query(() => [TeacherNote])
  async getStudentAccessibleNotes(
    @ActiveUser() user: ActiveUserData,
    @Args('filters', { nullable: true }) filters?: FilterTeacherNotesDto,
  ): Promise<TeacherNote[]> {
    return this.studentNotesService.getAccessibleNotes(user, filters);
  }

  /**
   * Get notes for a specific subject
   * @query getStudentNotesBySubject
   * @param {String} subjectId - Subject ID
   * @returns {TeacherNote[]} List of subject notes
   * 
   * @example
   * query {
   *   getStudentNotesBySubject(subjectId: "subject-uuid") {
   *     id
   *     title
   *     content
   *     links
   *     is_ai_generated
   *     teacher { first_name last_name }
   *   }
   * }
   */
  @Query(() => [TeacherNote])
  async getStudentNotesBySubject(
    @Args('subjectId') subjectId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TeacherNote[]> {
    return this.studentNotesService.getNotesBySubject(user, subjectId);
  }

  /**
   * Get notes specific to student's grade level
   * @query getStudentGradeNotes
   * @returns {TeacherNote[]} List of grade-specific notes
   * 
   * @example
   * query {
   *   getStudentGradeNotes {
   *     id
   *     title
   *     content
   *     gradeLevel { name }
   *     subject { name }
   *   }
   * }
   */
  @Query(() => [TeacherNote])
  async getStudentGradeNotes(
    @ActiveUser() user: ActiveUserData,
  ): Promise<TeacherNote[]> {
    return this.studentNotesService.getGradeNotes(user);
  }

  /**
   * Get school-wide notes
   * @query getStudentSchoolNotes
   * @returns {TeacherNote[]} List of school-wide notes
   * 
   * @example
   * query {
   *   getStudentSchoolNotes {
   *     id
   *     title
   *     content
   *     teacher { first_name last_name }
   *     created_at
   *   }
   * }
   */
  @Query(() => [TeacherNote])
  async getStudentSchoolNotes(
    @ActiveUser() user: ActiveUserData,
  ): Promise<TeacherNote[]> {
    return this.studentNotesService.getSchoolNotes(user);
  }

  /**
   * Get a specific note by ID (if student has access)
   * @query getStudentNoteById
   * @param {String} id - Note ID
   * @returns {TeacherNote} Note details
   * 
   * @example
   * query {
   *   getStudentNoteById(id: "note-uuid") {
   *     id
   *     title
   *     content
   *     links
   *     visibility
   *     teacher { first_name last_name }
   *   }
   * }
   */
  @Query(() => TeacherNote)
  async getStudentNoteById(
    @Args('id') id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TeacherNote> {
    return this.studentNotesService.getNoteById(id, user);
  }
}
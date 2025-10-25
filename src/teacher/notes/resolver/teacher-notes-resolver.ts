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


@Resolver(() => TeacherNote)
@Roles(MembershipRole.TEACHER, MembershipRole.SCHOOL_ADMIN)
export class TeacherNotesResolver {
  constructor(private readonly teacherNotesService: TeacherNotesService) {}

  /**
   * Create a new teacher note
   * @mutation createTeacherNote
   * @param {CreateTeacherNoteDto} createTeacherNoteDto - Note creation data
   * @returns {TeacherNote} Created note
   * 
   * @example
   * mutation {
   *   createTeacherNote(createTeacherNoteDto: {
   *     title: "Introduction to Algebra"
   *     content: "Key concepts: variables, expressions..."
   *     links: ["https://youtube.com/watch?v=xyz"]
   *     subject_id: "uuid-here"
   *     grade_level_id: "uuid-here"
   *     visibility: GRADE
   *     is_ai_generated: false
   *   }) {
   *     id
   *     title
   *     content
   *     visibility
   *     created_at
   *   }
   * }
   */
  @Mutation(() => TeacherNote)
  async createTeacherNote(
    @Args('createTeacherNoteDto') dto: CreateTeacherNoteDto,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TeacherNote> {
    return this.teacherNotesService.createNote(dto, user);
  }

  /**
   * Get all notes created by the logged-in teacher
   * @query getMyTeacherNotes
   * @param {FilterTeacherNotesDto} filters - Optional filters
   * @returns {TeacherNote[]} List of teacher's notes
   * 
   * @example
   * query {
   *   getMyTeacherNotes(filters: {
   *     grade_level_id: "uuid-here"
   *     subject_id: "uuid-here"
   *     visibility: GRADE
   *   }) {
   *     id
   *     title
   *     content
   *     visibility
   *     gradeLevel { id name }
   *     subject { id name }
   *   }
   * }
   */
  @Query(() => [TeacherNote])
  async getMyTeacherNotes(
    @ActiveUser() user: ActiveUserData,
    @Args('filters', { nullable: true }) filters?: FilterTeacherNotesDto,
  ): Promise<TeacherNote[]> {
    return this.teacherNotesService.getMyNotes(user, filters);
  }

  /**
   * Get a specific teacher note by ID
   * @query getTeacherNoteById
   * @param {String} id - Note ID
   * @returns {TeacherNote} Note details
   * 
   * @example
   * query {
   *   getTeacherNoteById(id: "note-uuid") {
   *     id
   *     title
   *     content
   *     links
   *     teacher { id first_name last_name }
   *   }
   * }
   */
  @Query(() => TeacherNote)
  async getTeacherNoteById(
    @Args('id') id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TeacherNote> {
    return this.teacherNotesService.getNoteById(id, user);
  }

  /**
   * Update a teacher note
   * @mutation updateTeacherNote
   * @param {UpdateTeacherNoteDto} updateTeacherNoteDto - Update data
   * @returns {TeacherNote} Updated note
   * 
   * @example
   * mutation {
   *   updateTeacherNote(updateTeacherNoteDto: {
   *     id: "note-uuid"
   *     title: "Updated Title"
   *     visibility: SCHOOL
   *   }) {
   *     id
   *     title
   *     updated_at
   *   }
   * }
   */
  @Mutation(() => TeacherNote)
  async updateTeacherNote(
    @Args('updateTeacherNoteDto') dto: UpdateTeacherNoteDto,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TeacherNote> {
    return this.teacherNotesService.updateNote(dto, user);
  }

  /**
   * Delete a teacher note
   * @mutation deleteTeacherNote
   * @param {String} id - Note ID
   * @returns {Boolean} Success status
   * 
   * @example
   * mutation {
   *   deleteTeacherNote(id: "note-uuid")
   * }
   */
  @Mutation(() => Boolean)
  async deleteTeacherNote(
    @Args('id') id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<boolean> {
    return this.teacherNotesService.deleteNote(id, user);
  }

  /**
   * Get all school-wide notes
   * @query getSchoolTeacherNotes
   * @returns {TeacherNote[]} List of school-wide notes
   * 
   * @example
   * query {
   *   getSchoolTeacherNotes {
   *     id
   *     title
   *     teacher { first_name last_name }
   *     created_at
   *   }
   * }
   */
  @Query(() => [TeacherNote])
  async getSchoolTeacherNotes(
    @ActiveUser() user: ActiveUserData,
  ): Promise<TeacherNote[]> {
    return this.teacherNotesService.getSchoolNotes(user);
  }
}
import { Resolver, Query, Args } from '@nestjs/graphql';
import { Student } from 'src/admin/student/entities/student.entity';
import { TeacherStudentsService } from './providers/teacher-students.service';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { TeacherStudentDto } from '../dtos/teacher-student.dto';
import { GraphQLExceptionsFilter } from 'src/admin/common/filter/graphQLException.filter';
import { UseFilters } from '@nestjs/common';
import { TeacherStudentResponse } from '../dtos/Teacher-student-response.dto';

@Resolver(() => Student)
export class TeacherStudentsResolver {
  constructor(
    private readonly teacherStudentsService: TeacherStudentsService,
  ) {}

  // @Query(() => [Student], { name: 'teacherGetStudents' })
  // async getStudents(
  //   @ActiveUser() userTenant: ActiveUserData,
  // ): Promise<Student[]> {
  //   return await this.teacherStudentsService.getStudentsByTenant(
  //     userTenant.tenantId,
  //   );
  // }

  @Query(() => [TeacherStudentResponse], { name: 'teacherGetStudents' })
  async getStudents(
    @ActiveUser() userTenant: ActiveUserData,
  ): Promise<TeacherStudentResponse[]> {
    return await this.teacherStudentsService.getStudentsByTenant(
      userTenant.tenantId,
    );
  }

  @Query(() => Student, { name: 'teacherGetStudentById', nullable: true })
  async getStudentById(
    @Args('studentId') studentId: string,
    @ActiveUser() userTenant: ActiveUserData,
  ): Promise<Student | null> {
    return await this.teacherStudentsService.getStudentById(
      studentId,
      userTenant.tenantId,
    );
  }

  // @Query(() => [Student], { name: 'teacherGetStudentsByGradeLevel' })
  // async getStudentsByGradeLevel(
  //   @Args('gradeLevelId') gradeLevelId: string,
  //   @ActiveUser() userTenant: ActiveUserData,
  // ): Promise<Student[]> {
  //   return await this.teacherStudentsService.getStudentsByGradeLevel(
  //     gradeLevelId,
  //     userTenant.tenantId,
  //   );
  // }

  @Query(() => [Student], { name: 'teacherGetStudentsByStream' })
  async getStudentsByStream(
    @Args('streamId') streamId: string,
    @ActiveUser() userTenant: ActiveUserData,
  ): Promise<Student[]> {
    return await this.teacherStudentsService.getStudentsByStream(
      streamId,
      userTenant.tenantId,
    );
  }

  @Query(() => [Student], { name: 'teacherGetStudentsByGradeLevel' })
  async getStudentsByGradeLevel(
    @Args('gradeLevelId') gradeLevelId: string,
    @ActiveUser() userTenant: ActiveUserData,
  ): Promise<Student[]> {
    return this.teacherStudentsService.getStudentsByGradeLevel(
      gradeLevelId,
      userTenant.tenantId,
    );
  }
}

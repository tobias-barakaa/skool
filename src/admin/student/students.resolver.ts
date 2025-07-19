// src/students/students.resolver.ts
import { Logger, UseFilters } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { Auth } from '../auth/decorator/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { GraphQLExceptionsFilter } from '../common/filter/graphQLException.filter';
import { CreateStudentInput } from './dtos/create-student-input.dto';
import { GradeLevelWithStreamsOutput } from './dtos/grade-level-with-streams.output';
import { CreateStudentResponse } from './dtos/student-response.dto';
import { StudentWithTenant } from './dtos/student-with-tenant.dto';
import { StudentsService } from './providers/student.service';

@Resolver()
@UseFilters(GraphQLExceptionsFilter)
export class StudentsResolver {
  private readonly logger = new Logger(StudentsResolver.name);

  constructor(private readonly studentsService: StudentsService) {}

  @Mutation(() => CreateStudentResponse, { name: 'createStudent' })
  @Auth(AuthType.Bearer)
  async createStudent(
    @Args('createStudentInput') createStudentInput: CreateStudentInput,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<CreateStudentResponse> {
    this.logger.log(
      `Admin ${currentUser.email} creating student: ${createStudentInput.email}`,
    );

    console.log('ActiveUserdfdffddddddddddd:', currentUser);

    return await this.studentsService.createStudent(
      createStudentInput,
      currentUser,
    );
  }

  @Query(() => [StudentWithTenant], { name: 'students' })
  @Auth(AuthType.Bearer)
  async getStudents(
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<StudentWithTenant[]> {
    const students = await this.studentsService.getAllStudentsByTenant(
      currentUser.tenantId,
    );

    return students.map((student) => ({
      id: student.id,
      admission_number: student.admission_number,
      phone: student.phone,
      gender: student.gender,
      grade: student.grade.toString(),
      user: student.user,
      user_id: student.user_id,
      feesOwed: student.feesOwed,
      totalFeesPaid: student.totalFeesPaid,
      createdAt: student.createdAt,
      isActive: student.isActive,
      updatedAt: student.updatedAt,
      streamName: student.stream?.name ?? [],
      tenantId: currentUser.tenantId,
    }));
  }

  @Query(() => [GradeLevelWithStreamsOutput])
  async gradeLevelsWithStreams(
    @ActiveUser() user: ActiveUserData,
  ): Promise<GradeLevelWithStreamsOutput[]> {
    return this.studentsService.getGradeLevelsWithStreamsForTenant(
      user.tenantId,
    );
  }

  @Mutation(() => [CreateStudentResponse], { name: 'createMultipleStudents' })
  @Auth(AuthType.Bearer)
  async createMultipleStudents(
    @Args('studentsData', { type: () => [CreateStudentInput] })
    studentsData: CreateStudentInput[],
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<CreateStudentResponse[]> {
    this.logger.log(
      `Admin ${currentUser.email} creating ${studentsData.length} students`,
    );

    return await this.studentsService.createMultipleStudents(
      studentsData,
      currentUser,
    );
  }

  @Mutation(() => String, { name: 'revokeStudent' })
  @Auth(AuthType.Bearer)
  async revokeStudent(
    @Args('studentId') studentId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<string> {
    const result = await this.studentsService.revokeStudent(
      studentId,
      currentUser,
    );
    return result.message;
  }
}

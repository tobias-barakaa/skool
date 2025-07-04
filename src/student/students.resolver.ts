// src/students/students.resolver.ts
import { Resolver, Mutation, Args, Context, Query } from '@nestjs/graphql';
import { Logger, UseFilters, UseGuards } from '@nestjs/common';
import { GraphQLExceptionsFilter } from '../common/filter/graphQLException.filter';
import { Auth } from '../auth/decorator/auth.decorator';
import { AuthType } from '../auth/enums/auth-type.enum';
import { User } from '../users/entities/user.entity';
import { CreateStudentResponse } from './dtos/student-response.dto';
import { CreateStudentInput } from './dtos/create-student-input.dto';
import { ActiveUser } from 'src/auth/decorator/active-user.decorator';
import { StudentsService } from './providers/student.service';
import { ActiveUserData } from 'src/auth/interface/active-user.interface';
import { Student } from './entities/student.entity';
import { StudentWithTenant } from './dtos/student-with-tenant.dto';

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
    this.logger.log(`Admin ${currentUser.email} creating student: ${createStudentInput.email}`);

    console.log('ActiveUserdfdffddddddddddd:', currentUser);

    return await this.studentsService.createStudent(createStudentInput, currentUser);
  }


  @Query(() => [StudentWithTenant], { name: 'students' })
@Auth(AuthType.Bearer)
async getStudents(
  @ActiveUser() currentUser: ActiveUserData
): Promise<StudentWithTenant[]> {
  const students = await this.studentsService.getAllStudentsByTenant(currentUser.tenantId);

  return students.map((student) => ({
    id: student.id,
    admission_number: student.admission_number,
    phone: student.phone,
    gender: student.gender,
    grade: student.grade,
    user: student.user,
    user_id: student.user_id,
    feesOwed: student.feesOwed,
    totalFeesPaid: student.totalFeesPaid,
    createdAt: student.createdAt,
    isActive: student.isActive,
    updatedAt: student.updatedAt,
    streamId: student.stream?.id ?? null,
    tenantId: currentUser.tenantId,
  }));
}


  @Mutation(() => [CreateStudentResponse], { name: 'createMultipleStudents' })
  @Auth(AuthType.Bearer)
  async createMultipleStudents(
    @Args('studentsData', { type: () => [CreateStudentInput] }) studentsData: CreateStudentInput[],
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<CreateStudentResponse[]> {
    this.logger.log(`Admin ${currentUser.email} creating ${studentsData.length} students`);

    return await this.studentsService.createMultipleStudents(studentsData, currentUser);
  }
}

// src/students/students.resolver.ts
import { Logger, UseFilters } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
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
import { Roles } from 'src/iam/decorators/roles.decorator';
import { MembershipRole } from '../user-tenant-membership/entities/user-tenant-membership.entity';
import { Student } from './entities/student.entity';
import { StudentLoginInfo } from './dtos/student-login-info.output';

@Resolver()
@UseFilters(GraphQLExceptionsFilter)
@Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.SUPER_ADMIN)
export class StudentsResolver {
  private readonly logger = new Logger(StudentsResolver.name);

  constructor(private readonly studentsService: StudentsService) {}

  @Mutation(() => CreateStudentResponse, { name: 'createStudent' })
  @Auth(AuthType.Bearer)
  async createStudent(
    @Args('createStudentInput') createStudentInput: CreateStudentInput,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<CreateStudentResponse> {
    console.log('ActiveUserdfdffddddddddddd:', currentUser);

    return await this.studentsService.createStudent(
      createStudentInput,
      currentUser,
    );
  }

  @Query(() => [Student], { name: 'studentsByGradeLevel' })
  @Auth(AuthType.Bearer)
  @Roles(MembershipRole.TEACHER, MembershipRole.SCHOOL_ADMIN)
  async studentsByGradeLevel(
    @Args('tenantGradeLevelId', { type: () => ID }) tenantGradeLevelId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Student[]> {
    return this.studentsService.getStudentsByTenantGradeLevel(
      tenantGradeLevelId,
      user,
    );
  }

  @Query(() => [StudentLoginInfo], { name: 'studentsForTenant' })
  @Auth(AuthType.Bearer)
  async getStudentsForTenant(
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<StudentLoginInfo[]> {
    return this.studentsService.getStudentsForTenant(currentUser);
  }

  @Query(() => [Student], { name: 'allStudents' })
  @Auth(AuthType.Bearer)
  @Roles(MembershipRole.TEACHER, MembershipRole.SCHOOL_ADMIN)
  async allStudents(@ActiveUser() user: ActiveUserData): Promise<Student[]> {
    console.log(user, 'this is the user');
    return this.studentsService.getAllStudentsByTenant(user);
  }

  // @Query(() => [StudentWithTenant], { name: 'students' })
  // @Auth(AuthType.Bearer)
  // async getStudents(
  //   @ActiveUser() currentUser: ActiveUserData,
  // ): Promise<StudentWithTenant[]> {
  //   const students = await this.studentsService.getAllStudentsByTenant(
  //     currentUser.tenantId,
  //   );

  //   return students.map((student) => ({
  //     id: student.id,
  //     admission_number: student.admission_number,
  //     phone: student.phone,
  //     gender: student.gender,
  //     grade: student.grade.toString(),
  //     user: student.user,
  //     user_id: student.user_id,
  //     feesOwed: student.feesOwed,
  //     totalFeesPaid: student.totalFeesPaid,
  //     createdAt: student.createdAt,
  //     isActive: student.isActive,
  //     updatedAt: student.updatedAt,
  //     streamName: student.stream?.name ?? [],
  //     tenantId: currentUser.tenantId,
  //   }));
  // }

  @Query(() => [GradeLevelWithStreamsOutput])
  async gradeLevelsWithStreams(
    @ActiveUser() user: ActiveUserData,
  ): Promise<GradeLevelWithStreamsOutput[]> {
    return this.studentsService.getGradeLevelsWithStreamsForTenant(
      user,
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

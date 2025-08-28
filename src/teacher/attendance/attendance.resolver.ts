// attendance.resolver.ts
import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Attendance } from './entities/attendance.entity';
import { AttendanceService } from './providers/attendance.service';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { CreateAttendanceInput } from './dtos/attendance.input';
import { Student } from 'src/admin/student/entities/student.entity';

@Resolver(() => Attendance)
export class AttendanceResolver {
  constructor(private attendanceService: AttendanceService) {}

  @Mutation(() => [Attendance])
  async markAttendance(
    @Args('markAttendanceInput') markAttendanceInput: CreateAttendanceInput,
    @ActiveUser() currentUser: ActiveUserData,
  ) {
    const userId = currentUser.sub; // This is the User ID, not Teacher ID
    const tenantId = currentUser.tenantId;

    return this.attendanceService.markAttendance(
      markAttendanceInput,
      userId, // Pass User ID
      tenantId,
    );
  }

  @Query(() => [Attendance])
  async getAttendanceByDate(
    @Args('date') date: string,
    @Args('gradeId') gradeId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ) {
    return this.attendanceService.getAttendanceByDate(
      date,
      gradeId,
      currentUser.tenantId,
    );
  }

  @Query(() => [Student])
  async getStudentsByGrade(
    @Args('gradeId') gradeId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ) {
    return this.attendanceService.getStudentsByGrade(
      gradeId,
      currentUser.tenantId,
    );
  }
}

// attendance.resolver.ts
import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Attendance } from './entities/attendance.entity';
import { AttendanceService } from './providers/attendance.service';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { CreateAttendanceInput } from './dtos/attendance.input';
import { Student } from 'src/admin/student/entities/student.entity';
import { Roles } from 'src/iam/decorators/roles.decorator';
import { MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';

@Resolver(() => Attendance)
export class AttendanceResolver {
  constructor(private attendanceService: AttendanceService) {}

  @Roles(MembershipRole.TEACHER, MembershipRole.SCHOOL_ADMIN)
  @Mutation(() => [Attendance], {
    description: 'Mark attendance for students in a specific grade',
  })
  async markAttendance(
    @Args('markAttendanceInput') markAttendanceInput: CreateAttendanceInput,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<Attendance[]> {
    return this.attendanceService.markAttendance(
      markAttendanceInput,
      currentUser,
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
      currentUser,
    );
  }

  @Query(() => [Student])
  async getStudentsByGrade(
    @Args('gradeId') gradeId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ) {
    return this.attendanceService.getStudentsByGrade(
      gradeId,
      currentUser,
    );
  }
}

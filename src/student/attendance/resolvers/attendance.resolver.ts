import { Resolver, Mutation, Query, Args, Subscription, Int } from '@nestjs/graphql';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { Attendance } from 'src/teacher/attendance/entities/attendance.entity';
import { StudentAttendanceService } from '../services/student.attendance.service';
import { AttendanceSummaryResponse } from '../dtos/student.attendance.dto';

// const pubSub = new PubSub() as PubSubEngine;

@Resolver()
export class StudentAttendanceResolver {

constructor(
    private readonly studentAttendanceService: StudentAttendanceService,
  ) {}
  @Query(() => AttendanceSummaryResponse)
  async getMyAttendanceSummary(
    @ActiveUser() user: ActiveUserData,
  ): Promise<AttendanceSummaryResponse> {
    return this.studentAttendanceService.getSummary(user);
  }
  

}
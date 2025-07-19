import { InputType, Field } from '@nestjs/graphql';
import { AttendanceStatus } from '../entities/attendance.entity';

@InputType()
export class AttendanceInput {
  @Field()
  studentId: string;

  @Field()
  status: AttendanceStatus;
}

@InputType()
export class CreateAttendanceInput {
  @Field()
  date: string; // Frontend sends as string "2025-07-18"

  @Field()
  gradeId: string;

  @Field(() => [AttendanceInput])
  attendanceRecords: AttendanceInput[];
}

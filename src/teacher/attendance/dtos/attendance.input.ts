import { InputType, Field } from '@nestjs/graphql';
import { AttendanceStatus } from '../entities/attendance.entity';

import { IsUUID, IsEnum, IsString, IsArray } from 'class-validator';

@InputType()
export class AttendanceInput {
  @Field()
  @IsUUID()
  studentId: string;

  @Field(() => AttendanceStatus)
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;
}

@InputType()
export class CreateAttendanceInput {
  @Field()
  @IsString()
  date: string;

  @Field()
  @IsUUID()
  gradeId: string;

  @Field(() => [AttendanceInput])
  @IsArray()
  attendanceRecords: AttendanceInput[];
}

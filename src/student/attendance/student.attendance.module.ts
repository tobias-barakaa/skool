import { Module } from "@nestjs/common";
import { StudentAttendanceService } from "./services/student.attendance.service";
import { StudentAttendanceResolver } from "./resolvers/attendance.resolver";


@Module({
  providers: [StudentAttendanceService,StudentAttendanceResolver ],
  exports: [],
  imports: [],
})
export class StudentAttendanceModule {}

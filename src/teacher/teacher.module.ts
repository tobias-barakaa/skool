import { Module } from '@nestjs/common';
import { TestModule } from './test/test.module';
import { AttendanceModule } from './attendance/attendance.module';

@Module({
  imports: [TestModule, AttendanceModule],
  exports: [TestModule],
  providers: []

})
export class TeacherModule {}

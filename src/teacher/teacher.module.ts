import { Module } from '@nestjs/common';
import { TestModule } from './test/test.module';
import { AttendanceModule } from './attendance/attendance.module';

import { TeacherStudentsModule } from './students/students.module';
import { TeacherParentsModule } from './parents/parents.module';
import { MarksheetModule } from './marksheet/marksheet-module';


@Module({
  imports: [
    TestModule,
    AttendanceModule,
    TeacherParentsModule,
    TeacherStudentsModule,
    MarksheetModule,
  ],
  exports: [TestModule],
  providers: [],
})
export class TeacherModule {}

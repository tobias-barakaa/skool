import { Module } from '@nestjs/common';
import { TestModule } from './test/test.module';
import { AttendanceModule } from './attendance/attendance.module';
import { MessagingModule } from './messaging/messaging.module';

import { TeacherStudentsModule } from './students/students.module';
import { TeacherParentsModule } from './parents/parents.module';


@Module({
  imports: [
    TestModule,
    AttendanceModule,
    TeacherParentsModule,
    MessagingModule,
    TeacherStudentsModule,
  ],
  exports: [TestModule],
  providers: [],
})
export class TeacherModule {}

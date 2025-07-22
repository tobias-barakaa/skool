import { Module } from '@nestjs/common';
import { TeacherStudentsProvider } from './providers/teacher-students.provider';
import { TeacherStudentsService } from './providers/teacher-students.service';
import { TeacherStudentsResolver } from './teacher-students.resolver';
import { StudentModule } from 'src/admin/student/student.module';

@Module({
  imports: [StudentModule],
  providers: [
    TeacherStudentsProvider,
    TeacherStudentsService,
    TeacherStudentsResolver,
  ],
  exports: [TeacherStudentsService],
})
export class TeacherStudentsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherNote } from 'src/teacher/notes/entities/teacher-note.entity';
import { StudentNotesService } from './services/student-notes.service';
import { StudentNotesResolver } from './resolvers/student-notes.resolver';
import { Student } from 'src/admin/student/entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TeacherNote, Student])],
  providers: [StudentNotesService, StudentNotesResolver],
  exports: [StudentNotesService],
})
export class StudentNotesModule {}
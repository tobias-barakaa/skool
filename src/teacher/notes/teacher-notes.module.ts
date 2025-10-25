import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherNote } from './entities/teacher-note.entity';
import { TeacherNotesService } from './services/teacher-notes.service';
import { TeacherNotesResolver } from './resolver/teacher-notes-resolver';

@Module({
  imports: [TypeOrmModule.forFeature([TeacherNote])],
  providers: [TeacherNotesService, TeacherNotesResolver],
  exports: [TeacherNotesService],
})
export class TeacherNotesModule {}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherParentsProvider } from './providers/teacher-parents.provider';
import { Parent } from 'src/admin/parent/entities/parent.entity';
import { ParentStudent } from 'src/admin/parent/entities/parent-student.entity';
import { TeacherParentsService } from './providers/teacher-parents.service';
import { TeacherParentsResolver } from './providers/teacher-parents.resolver';
import { ParentService } from 'src/admin/parent/providers/parent.service';

@Module({
  imports: [TypeOrmModule.forFeature([Parent, ParentStudent])],
  providers: [
    TeacherParentsProvider,
    TeacherParentsService,
    TeacherParentsResolver,
  ],
  exports: [

    TypeOrmModule.forFeature([Parent, ParentStudent]),
    
  ],
})
export class TeacherParentsModule {}

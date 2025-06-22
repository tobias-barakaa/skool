import { Module } from '@nestjs/common';
import { CurriculumService } from './providers/curriculum.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Curriculum } from './entities/curicula.entity';
import { CurriculumSubject } from './entities/curriculum_subjects.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Curriculum, CurriculumSubject])],
  exports: [CurriculumService, TypeOrmModule],
  providers: [CurriculumService]
})
export class CurriculumModule {}

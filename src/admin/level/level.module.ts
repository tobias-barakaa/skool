import { Module } from '@nestjs/common';
import { LevelService } from './providers/level.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Level } from './entities/level.entities';
import { GradeLevel } from './entities/grade-level.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Level, GradeLevel])],
  providers: [LevelService],
  exports: [LevelService, TypeOrmModule.forFeature([GradeLevel])],
})
export class LevelModule {}

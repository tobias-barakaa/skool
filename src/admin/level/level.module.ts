import { Module } from '@nestjs/common';
import { LevelService } from './providers/level.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Level } from './entities/level.entities';
import { GradeLevel } from './entities/grade-level.entity';
import { CreateTenantGradeLevelProvider } from './providers/create-tenant-grade-level.provider';
import { CreateTenantGradeLevelService } from './providers/services/create-tenant-grade-level.service';
import { SchoolTypeModule } from '../school-type/school-type.module';

@Module({
  imports: [TypeOrmModule.forFeature([Level, GradeLevel]), SchoolTypeModule],
  providers: [
    LevelService,

    CreateTenantGradeLevelProvider,
    CreateTenantGradeLevelService,
  ],
  exports: [
    LevelService,
    TypeOrmModule.forFeature([GradeLevel]),
    CreateTenantGradeLevelProvider,
    CreateTenantGradeLevelService,
  ],
})
export class LevelModule {}

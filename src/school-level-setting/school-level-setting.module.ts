import { Module } from '@nestjs/common';
import { SchoolLevelSettingService } from './providers/school-level-setting.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolLevelSetting } from './entities/school-level-setting.entity';
import { SchoolsModule } from 'src/school/school.module';
import { LevelModule } from 'src/level/level.module';
import { SchoolLevelSettingResolver } from './school-level-setting.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([SchoolLevelSetting]), SchoolsModule, LevelModule],
  providers: [SchoolLevelSettingService, SchoolLevelSettingResolver]
})
export class SchoolLevelSettingModule {}

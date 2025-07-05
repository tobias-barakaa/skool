import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolsModule } from 'src/admin/school/school.module';
import { SchoolLevelSetting } from './entities/school-level-setting.entity';
import { SchoolLevelSettingService } from './providers/school-level-setting.service';
import { LevelModule } from '../level/level.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SchoolLevelSetting]),
    SchoolsModule,
    LevelModule,
  ],
  providers: [SchoolLevelSettingService],
})
export class SchoolLevelSettingModule {}

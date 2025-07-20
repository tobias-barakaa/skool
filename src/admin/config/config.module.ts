import { Module } from '@nestjs/common';
import { SchoolSetupGuardService } from './school-config.guard';
import { SchoolTypeModule } from '../school-type/school-type.module';

@Module({
  imports: [SchoolTypeModule],
  providers: [SchoolSetupGuardService],
  exports: [SchoolSetupGuardService],
})
export class SchoolConfigModule {}

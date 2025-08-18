import { Global, Module } from '@nestjs/common';
import { SchoolSetupGuardService } from './school-config.guard';
import { SchoolTypeModule } from '../school-type/school-type.module';

@Global()
@Module({
  imports: [SchoolTypeModule],
  providers: [SchoolSetupGuardService],
  exports: [SchoolSetupGuardService],
})
export class SchoolConfigModule {}

import { Module } from '@nestjs/common';
import { SchoolService } from './providers/school.service';

@Module({
  providers: [SchoolService]
})
export class SchoolModule {}

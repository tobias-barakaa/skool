import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School } from './entities/school.entity';
import { SchoolService } from './providers/school.service';
import { SchoolCreateProvider } from './providers/school-create.provider';

@Module({
  imports: [TypeOrmModule.forFeature([School])],
  providers: [SchoolService, SchoolCreateProvider],
  exports: [SchoolService, SchoolCreateProvider],
})
export class SchoolsModule {}
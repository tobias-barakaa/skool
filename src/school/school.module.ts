import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolsService } from './schools.service';
import { SchoolsResolver } from './schools.resolver';
import { School } from './entities/school.entity';

@Module({
  imports: [TypeOrmModule.forFeature([School])],
  providers: [SchoolsService, SchoolsResolver],
  exports: [SchoolsService],
})
export class SchoolsModule {}
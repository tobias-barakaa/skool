import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School } from './entities/school.entity';
import { SchoolsService } from './providers/school.service';

@Module({
  imports: [TypeOrmModule.forFeature([School])],
  providers: [SchoolsService],
  exports: [SchoolsService],
})
export class SchoolsModule {}
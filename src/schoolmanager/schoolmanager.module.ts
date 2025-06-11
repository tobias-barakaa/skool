import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolManager } from './entities/school-manager.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SchoolManager])], 
  providers: [],
  exports: [],
})
export class SchoolmanagerModule {}

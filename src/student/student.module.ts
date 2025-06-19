import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student])], 
  providers: [],
  exports: [TypeOrmModule],
})
export class StudentModule {}

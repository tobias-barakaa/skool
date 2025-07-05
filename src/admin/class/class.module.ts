import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Class } from './entities/class.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Class])], 
  providers: [],
  exports: [],
})
export class ClassModule {}

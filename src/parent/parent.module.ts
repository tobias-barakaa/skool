import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parent } from './entities/parent.entity';
import { ParentService } from './providers/parent.service';

@Module({
  imports: [TypeOrmModule.forFeature([Parent])], 
  providers: [ParentService],
  exports: [],
})
export class ParentModule {}

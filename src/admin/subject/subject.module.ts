import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subject } from './entities/subject.entity';
import { UserSubjectSelection } from './entities/user.subject_selection.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Subject,UserSubjectSelection])], 
  providers: [],
  exports: [TypeOrmModule],
})
export class SubjectModule {}

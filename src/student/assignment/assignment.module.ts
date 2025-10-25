import { Module } from '@nestjs/common';
import { StudentTestResolver } from './resolvers/student-test.resolver';
import { StudentTestProvider } from './providers/student-test.provider';

@Module({
  providers: [
    StudentTestProvider,
    StudentTestResolver

  ],
  exports: [],
})
export class AssignmentModule {}
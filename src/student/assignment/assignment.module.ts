import { Module } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { AssignmentResolver } from './assignment.resolver';
import { AssignmentProvider } from './providers/assignment.provider';

@Module({
  providers: [
    AssignmentService,
    AssignmentResolver,
    AssignmentProvider,
  ],
  exports: [AssignmentService],
})
export class AssignmentModule {}
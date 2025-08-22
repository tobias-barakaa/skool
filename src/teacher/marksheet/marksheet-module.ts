import { Module } from '@nestjs/common';
import { MarksheetProvider } from './providers/marksheet-provider';
import { AssessmentModule } from './assessment/assessment.module';

@Module({
  providers: [MarksheetProvider],
  imports: [AssessmentModule]
})
export class MarksheetModule {}

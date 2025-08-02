import { Module } from '@nestjs/common';
import { MarksheetProvider } from './providers/marksheet-provider';

@Module({
  providers: [MarksheetProvider]
})
export class MarksheetModule {}

import { Module } from '@nestjs/common';
import { EmailService } from './providers/email.service';

@Module({
  providers: [EmailService],
  exports: [EmailService]
})
export class EmailModule {}

import { Module } from '@nestjs/common';
import { EmailService } from './providers/email.service';
import { TenantsModule } from 'src/tenants/tenants.module';

@Module({
  imports: [TenantsModule],
  providers: [EmailService],
  exports: [EmailService]
})
export class EmailModule {}

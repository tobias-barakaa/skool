import { Module } from '@nestjs/common';
import { TenantsModule } from 'src/admin/tenants/tenants.module';
import { EmailService } from './providers/email.service';

@Module({
  imports: [TenantsModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}

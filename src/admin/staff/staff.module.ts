import { Module } from '@nestjs/common';
import { StaffService } from './providers/staff.service';
import { EmailModule } from 'src/admin/email/email.module';
import { UserModule } from 'src/admin/users/users.module';
import { AuthModule } from 'src/admin/auth/auth.module';
import { UserTenantMembershipModule } from 'src/admin/user-tenant-membership/user-tenant-membership.module';
import { TenantsModule } from 'src/admin/tenants/tenants.module';
import { InvitationModule } from 'src/admin/invitation/invitation.module';
import { EmailService } from 'src/admin/email/providers/email.service';
import { GenerateTokenProvider } from 'src/admin/auth/providers/generate-token.provider';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Staff } from './entities/staff.entity';
import { StaffResolver } from './staff.resolver';

@Module({
  providers: [StaffService, StaffResolver],
  imports: [
    TypeOrmModule.forFeature([Staff]),
    EmailModule,
    UserModule,
    AuthModule,
    UserTenantMembershipModule,
    TenantsModule,
    InvitationModule,
  ],
})
export class StaffModule {}

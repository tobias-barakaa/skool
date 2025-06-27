import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Teacher } from './entities/teacher.entity';
import { TeacherService } from './providers/teacher.service';
import { UserModule } from 'src/users/users.module';
import { EmailModule } from 'src/email/email.module';
import { TenantsModule } from 'src/tenants/tenants.module';
import { UserTenantMembershipModule } from 'src/user-tenant-membership/user-tenant-membership.module';
import { InvitationModule } from 'src/invitation/invitation.module';

@Module({
  imports: [TypeOrmModule.forFeature([Teacher]),EmailModule, UserModule,InvitationModule,TenantsModule, UserTenantMembershipModule], 
  providers: [TeacherService],
  exports: [TypeOrmModule],
})
export class TeacherModule {}

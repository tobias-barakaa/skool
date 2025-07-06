import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parent } from './entities/parent.entity';
import { ParentStudent } from './entities/parent-student.entity';
import { ParentResolver } from './parent.resolver';
import { ParentService } from './providers/parent.service';
import { UserModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';
import { AuthModule } from '../auth/auth.module';
import { InvitationModule } from '../invitation/invitation.module';
import { UserTenantMembershipModule } from '../user-tenant-membership/user-tenant-membership.module';
import { StudentModule } from '../student/student.module';
import { EmailModule } from '../email/email.module';
// import { ParentService } from './providers/parent.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Parent, ParentStudent]),
    UserModule,
    TenantsModule,
    AuthModule,
    InvitationModule,
    UserTenantMembershipModule,
    StudentModule,
    EmailModule,
  ],
  providers: [ParentService, ParentResolver],
  exports: [],
})
export class ParentModule {}

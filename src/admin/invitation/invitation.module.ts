import { forwardRef, Module } from '@nestjs/common';
import { InvitationService } from './providers/invitation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserInvitation } from './entities/user-iInvitation.entity';
import { GenericInviterProvider } from './providers/generic-inviter.provider';
import { UserTenantMembershipModule } from '../user-tenant-membership/user-tenant-membership.module';
import { UserModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';
import { AcceptInvitationProvider } from './providers/accept-invitation.provider';
import { GenericDeleteProvider } from './providers/generic-delete.provider';
import { GenericPendingProvider } from './providers/generic-pending.provider';
import { TeacherModule } from 'src/teacher/teacher.module';
import { AuthModule } from '../auth/auth.module';
import { Teacher } from '../teacher/entities/teacher.entity';

@Module({
  providers: [
    InvitationService,
    GenericInviterProvider,
    AcceptInvitationProvider,
    GenericDeleteProvider,
    GenericInviterProvider,
    GenericPendingProvider,
  ],
  imports: [
    TypeOrmModule.forFeature([UserInvitation, Teacher]),
    UserTenantMembershipModule,
    forwardRef(() => TeacherModule),
    forwardRef(() => UserModule),
    TenantsModule,
    AuthModule,
  ],
  exports: [InvitationService, TypeOrmModule],
})
export class InvitationModule {}

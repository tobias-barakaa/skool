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
import { AuthModule } from '../auth/auth.module';

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
    TypeOrmModule.forFeature([UserInvitation]),
    UserTenantMembershipModule,
    forwardRef(() => UserModule),
    TenantsModule,
    AuthModule,
  ],
  exports: [InvitationService, TypeOrmModule],
})
export class InvitationModule {}

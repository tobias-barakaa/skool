import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/admin/users/entities/user.entity';
import { TenantRoleGuard } from './guards/tenant-role.guard';
import { UserTenantMembershipModule } from 'src/admin/user-tenant-membership/user-tenant-membership.module';
import { UserModule } from 'src/admin/users/users.module';
import { UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserTenantMembership])],

  providers: [TenantRoleGuard],
  exports: [TenantRoleGuard, TypeOrmModule],
})
export class IamModule {}

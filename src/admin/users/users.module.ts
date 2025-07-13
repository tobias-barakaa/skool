import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/admin/auth/auth.module';
import { SchoolsModule } from 'src/admin/school/school.module';
import { TenantsModule } from 'src/admin/tenants/tenants.module';
import profileConfig from './config/profile.config';
import { User } from './entities/user.entity';
import { UsersCreateProvider } from './providers/users-create.provider';
import { UsersService } from './providers/users.service';
import { UsersResolver } from './users.resolver';
import { InvitationModule } from '../invitation/invitation.module';
import { UserTenantMembershipModule } from '../user-tenant-membership/user-tenant-membership.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    SchoolsModule,
    ConfigModule.forFeature(profileConfig),
    forwardRef(() => AuthModule),
    forwardRef(() => InvitationModule),
    TenantsModule,
    UserTenantMembershipModule,
  ],
  providers: [UsersService, UsersCreateProvider, UsersResolver],
  exports: [TypeOrmModule, UsersService],
})
export class UserModule {}

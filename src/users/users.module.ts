import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { SchoolsModule } from 'src/school/school.module';
import { UsersCreateProvider } from './providers/users-create.provider';
import { UsersService } from './providers/users.service';
import { UsersResolver } from './users.resolver';
import { ConfigModule } from '@nestjs/config';
import profileConfig from './config/profile.config';
import { AuthModule } from 'src/auth/auth.module';
import { TenantsModule } from 'src/tenants/tenants.module';
import { UserTenantMembershipModule } from 'src/user-tenant-membership/user-tenant-membership.module';
import { InvitationModule } from 'src/invitation/invitation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    SchoolsModule,
    ConfigModule.forFeature(profileConfig),
    forwardRef(() => AuthModule),
    InvitationModule,
    TenantsModule,
    UserTenantMembershipModule
  ],
  providers: [UsersService,UsersCreateProvider, UsersResolver],
  exports: [TypeOrmModule,UsersService],
})
export class UserModule {}

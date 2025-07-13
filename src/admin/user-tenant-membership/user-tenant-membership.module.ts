import { Module } from '@nestjs/common';
import { SchoolsModule } from 'src/admin/school/school.module';
import { ConfigModule } from '@nestjs/config';
import { OrganizationsModule } from 'src/admin/organizations/organizations.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTenantMembership } from './entities/user-tenant-membership.entity';
import profileConfig from '../users/config/profile.config';


@Module({
  imports: [
    TypeOrmModule.forFeature([UserTenantMembership]),
    SchoolsModule,
    ConfigModule.forFeature(profileConfig),
    OrganizationsModule,
  ],
  providers: [],
  exports: [TypeOrmModule],
})
export class UserTenantMembershipModule {}

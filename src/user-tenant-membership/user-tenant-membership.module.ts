import { Module } from '@nestjs/common';
import { SchoolsModule } from 'src/school/school.module';
import { ConfigModule } from '@nestjs/config';
import profileConfig from 'src/users/config/profile.config';
import { OrganizationsModule } from 'src/organizations/organizations.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTenantMembership } from './entities/user-tenant-membership.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([UserTenantMembership]), 
    SchoolsModule,
    ConfigModule.forFeature(profileConfig),
    OrganizationsModule
  ],
  providers: [],
  exports: [],
})


export class UserTenantMembershipModule {}

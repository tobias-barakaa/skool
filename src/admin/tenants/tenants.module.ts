import { Module } from '@nestjs/common';
import { SchoolsModule } from 'src/admin/school/school.module';
import { ConfigModule } from '@nestjs/config';
import { TenantService } from './providers/tenants.service';
import { OrganizationsModule } from 'src/admin/organizations/organizations.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from 'src/admin/organizations/entities/organizations-entity';
import { Tenant } from './entities/tenant.entity';
import profileConfig from '../users/config/profile.config';


@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant]),
    SchoolsModule,
    ConfigModule.forFeature(profileConfig),
    OrganizationsModule
  ],
  providers: [TenantService],
  exports: [TenantService, TypeOrmModule],
})


export class TenantsModule {}

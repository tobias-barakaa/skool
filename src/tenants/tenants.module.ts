import { Module } from '@nestjs/common';
import { SchoolsModule } from 'src/school/school.module';
import { ConfigModule } from '@nestjs/config';
import profileConfig from 'src/users/config/profile.config';
import { TenantService } from './providers/tenants.service';
import { OrganizationsModule } from 'src/organizations/organizations.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from 'src/organizations/entities/organizations-entity';
import { Tenant } from './entities/tenant.entity';


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

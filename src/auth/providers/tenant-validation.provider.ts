import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Tenant } from "src/tenants/entities/tenant.entity";
import { UserTenantMembership } from "src/user-tenant-membership/entities/user-tenant-membership.entity";
import { Repository } from "typeorm";

// src/auth/services/tenant-validation.service.ts
@Injectable()
export class TenantValidationProvider {
  constructor(
    @InjectRepository(UserTenantMembership)
    private membershipRepository: Repository<UserTenantMembership>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

  async validateUserTenantAccess(userId: string, tenantId: string): Promise<{
    tenant: Tenant;
    membership: UserTenantMembership;
  }> {
    // Verify tenant exists
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId }
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Verify user has access to this tenant
    const membership = await this.membershipRepository.findOne({
      where: { 
        userId,
        tenantId,
        // Add any additional conditions like active status
      }
    });

    if (!membership) {
      throw new ForbiddenException('User does not have access to this tenant');
    }

    return { tenant, membership };
  }
}
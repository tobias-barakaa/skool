import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Organization } from 'src/organizations/entities/organizations-entity';
import { Repository } from 'typeorm';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>
  ) {}

  async getOrganizationBySubdomain(subdomain: string) {
    return this.organizationRepository.findOne({
      where: { subdomain, isActive: true }
    });
  }

  async validateTenant(subdomain: string): Promise<boolean> {
    const org = await this.getOrganizationBySubdomain(subdomain);
    return !!org;
  }


}
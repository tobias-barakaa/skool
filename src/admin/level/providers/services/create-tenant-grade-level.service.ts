import { Injectable, Logger } from '@nestjs/common';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';
import { CreateTenantGradeLevelDto, CreateTenantGradeLevelProvider } from '../create-tenant-grade-level.provider';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SchoolConfig } from 'src/admin/school-type/entities/school-config.entity';

@Injectable()
export class CreateTenantGradeLevelService {
  private readonly logger = new Logger(CreateTenantGradeLevelService.name);

  constructor(
    private readonly createTenantGradeLevelProvider: CreateTenantGradeLevelProvider,
     @InjectRepository(TenantGradeLevel)
       private readonly repo: Repository<TenantGradeLevel>,
        @InjectRepository(SchoolConfig)
        private readonly configRepo: Repository<SchoolConfig>,
  ) {}

  async createTenantGradeLevel(
    dto: CreateTenantGradeLevelDto,
  ): Promise<TenantGradeLevel> {
    this.logger.log(`Creating tenant grade level for tenant: ${dto.tenantId}`);
    return await this.createTenantGradeLevelProvider.createTenantGradeLevel(
      dto,
    );
  }

  async deleteTenantGradeLevel(
    tenantGradeLevelId: string,
    tenantId: string,
  ): Promise<boolean> {
    this.logger.log(
      `Deleting tenant grade level: ${tenantGradeLevelId} for tenant: ${tenantId}`,
    );
    return await this.createTenantGradeLevelProvider.deleteTenantGradeLevel(
      tenantGradeLevelId,
      tenantId,
    );
  }

  async getTenantGradeLevels(
    tenantId: string,
    curriculumId?: string,
  ): Promise<TenantGradeLevel[]> {
    this.logger.log(`Getting tenant grade levels for tenant: ${tenantId}`);
    return await this.createTenantGradeLevelProvider.getTenantGradeLevels(
      tenantId,
      curriculumId,
    );
  }

  async getTenantGradeLevelById(
    tenantGradeLevelId: string,
    tenantId: string,
  ): Promise<TenantGradeLevel | null> {
    this.logger.log(
      `Getting tenant grade level: ${tenantGradeLevelId} for tenant: ${tenantId}`,
    );
    return await this.createTenantGradeLevelProvider.getTenantGradeLevelById(
      tenantGradeLevelId,
      tenantId,
    );
  }

  async bulkCreateTenantGradeLevels(
    gradeLevels: CreateTenantGradeLevelDto[],
  ): Promise<TenantGradeLevel[]> {
    this.logger.log(`Bulk creating ${gradeLevels.length} tenant grade levels`);
    return await this.createTenantGradeLevelProvider.bulkCreateTenantGradeLevels(
      gradeLevels,
    );
  }

  async getGradeLevelsWithTenantStreams(
    tenantId: string,
    curriculumId?: string,
  ): Promise<any[]> {
    this.logger.log(
      `Getting tenant grade levels with streams for tenant: ${tenantId}`,
    );
    return await this.createTenantGradeLevelProvider.getGradeLevelsWithTenantStreams(
      tenantId,
      curriculumId,
    );
  };




}

import { Injectable, Logger } from '@nestjs/common';
import { CreateTenantSubjectDto, CreateTenantSubjectProvider, UpdateTenantSubjectDto } from '../create-tenant-subject.provider';
import { TenantSubject } from 'src/admin/school-type/entities/tenant-specific-subject';


@Injectable()
export class CreateTenantSubjectService {
  private readonly logger = new Logger(CreateTenantSubjectService.name);

  constructor(
    private readonly createTenantSubjectProvider: CreateTenantSubjectProvider,
  ) {}

  async createTenantSubject(
    dto: CreateTenantSubjectDto,
  ): Promise<TenantSubject> {
    this.logger.log(`Creating tenant subject for tenant: ${dto.tenantId}`);
    return await this.createTenantSubjectProvider.createTenantSubject(dto);
  }

  async updateTenantSubject(
    tenantSubjectId: string,
    tenantId: string,
    updateDto: UpdateTenantSubjectDto,
  ): Promise<TenantSubject> {
    this.logger.log(
      `Updating tenant subject: ${tenantSubjectId} for tenant: ${tenantId}`,
    );
    return await this.createTenantSubjectProvider.updateTenantSubject(
      tenantSubjectId,
      tenantId,
      updateDto,
    );
  }

  async deleteTenantSubject(
    tenantSubjectId: string,
    tenantId: string,
  ): Promise<boolean> {
    this.logger.log(
      `Deleting tenant subject: ${tenantSubjectId} for tenant: ${tenantId}`,
    );
    return await this.createTenantSubjectProvider.deleteTenantSubject(
      tenantSubjectId,
      tenantId,
    );
  }

  async getTenantSubjects(
    tenantId: string,
    curriculumId?: string,
  ): Promise<TenantSubject[]> {
    this.logger.log(`Getting tenant subjects for tenant: ${tenantId}`);
    return await this.createTenantSubjectProvider.getTenantSubjects(
      tenantId,
      curriculumId,
    );
  }


  }


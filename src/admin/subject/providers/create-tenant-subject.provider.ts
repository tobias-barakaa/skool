import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Subject } from '../entities/subject.entity';
import { Curriculum } from '../../curriculum/entities/curicula.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TenantSubject } from 'src/admin/school-type/entities/tenant-specific-subject';
import { CacheProvider } from 'src/common/providers/cache.provider';
import { SchoolConfig } from 'src/admin/school-type/entities/school-config.entity';

export interface CreateTenantSubjectDto {
  tenantId: string;
  schoolConfigId: string; // new
  subjectType?: 'core' | 'elective';
  isCompulsory?: boolean;
  totalMarks?: number;
  passingMarks?: number;
  creditHours?: number;
}

export interface UpdateTenantSubjectDto {
  subjectType?: 'core' | 'elective';
  isCompulsory?: boolean;
  totalMarks?: number;
  passingMarks?: number;
  creditHours?: number;
}

@Injectable()
export class CreateTenantSubjectProvider {
  private readonly logger = new Logger(CreateTenantSubjectProvider.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly cacheProvider: CacheProvider,
  ) {}

    async createTenantSubject(dto: CreateTenantSubjectDto): Promise<TenantSubject> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tenant = await queryRunner.manager.findOne(Tenant, { where: { id: dto.tenantId } });
      if (!tenant) {
        throw new BadRequestException('Tenant not found');
      }

      const schoolConfig = await queryRunner.manager.findOne(SchoolConfig, { where: { id: dto.schoolConfigId } });
      if (!schoolConfig) {
        throw new BadRequestException('You must configure school first');
      }

      // const existingTenantSubject = await queryRunner.manager.findOne(TenantSubject, {
      //   where: {
      //     tenant: { id: dto.tenantId },
      //     schoolConfigId: dto.schoolConfigId,
      //   },
      //   relations: ['tenant'],
      // });

      // if (existingTenantSubject) {
      //   throw new BadRequestException('Tenant subject already exists for this school configuration');
      // }

      const tenantSubject = queryRunner.manager.create(TenantSubject, {
        tenant: { id: dto.tenantId },
        schoolConfigId: dto.schoolConfigId,
        subjectType: dto.subjectType || 'core',
        isCompulsory: dto.isCompulsory ?? true,
        totalMarks: dto.totalMarks,
        passingMarks: dto.passingMarks,
        creditHours: dto.creditHours,
        isActive: true,
      });

      const result = await queryRunner.manager.save(TenantSubject, tenantSubject);

      await queryRunner.commitTransaction();
      await this.invalidateCache(dto.tenantId);

      this.logger.log(`Created tenant subject: ${result.id} for tenant: ${dto.tenantId}`);
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to create tenant subject:', error.message);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }


  async updateTenantSubject(
    tenantSubjectId: string,
    tenantId: string,
    updateDto: UpdateTenantSubjectDto
  ): Promise<TenantSubject> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find and validate tenant subject belongs to tenant
      const tenantSubject = await queryRunner.manager.findOne(TenantSubject, {
        where: {
          id: tenantSubjectId,
          tenant: { id: tenantId }
        },
        relations: ['tenant', 'curriculum', 'subject']
      });

      if (!tenantSubject) {
        throw new NotFoundException('Tenant subject not found or does not belong to this tenant');
      }

      // Update fields
      if (updateDto.subjectType !== undefined) tenantSubject.subjectType = updateDto.subjectType;
      if (updateDto.isCompulsory !== undefined) tenantSubject.isCompulsory = updateDto.isCompulsory;
      if (updateDto.totalMarks !== undefined) tenantSubject.totalMarks = updateDto.totalMarks;
      if (updateDto.passingMarks !== undefined) tenantSubject.passingMarks = updateDto.passingMarks;
      if (updateDto.creditHours !== undefined) tenantSubject.creditHours = updateDto.creditHours;

      tenantSubject.updatedAt = new Date();

      const result = await queryRunner.manager.save(TenantSubject, tenantSubject);

      await queryRunner.commitTransaction();
      await this.invalidateCache(tenantId);

      this.logger.log(`Updated tenant subject: ${tenantSubjectId} for tenant: ${tenantId}`);
      return result;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to update tenant subject:', error.message);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteTenantSubject(tenantSubjectId: string, tenantId: string): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find and validate tenant subject belongs to tenant
      const tenantSubject = await queryRunner.manager.findOne(TenantSubject, {
        where: {
          id: tenantSubjectId,
          tenant: { id: tenantId }
        }
      });

      if (!tenantSubject) {
        throw new NotFoundException('Tenant subject not found or does not belong to this tenant');
      }

      // Soft delete by setting isActive to false
      tenantSubject.isActive = false;
      tenantSubject.updatedAt = new Date();

      await queryRunner.manager.save(TenantSubject, tenantSubject);

      await queryRunner.commitTransaction();
      await this.invalidateCache(tenantId);

      this.logger.log(`Deleted tenant subject: ${tenantSubjectId} for tenant: ${tenantId}`);
      return true;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to delete tenant subject:', error.message);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getTenantSubjects(tenantId: string, curriculumId?: string): Promise<TenantSubject[]> {
    const cacheKey = `tenant_subjects:${tenantId}${curriculumId ? `:${curriculumId}` : ''}`;

    let cached = await this.cacheProvider.get<TenantSubject[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      const whereClause: any = {
        tenant: { id: tenantId },
        isActive: true
      };

      if (curriculumId) {
        whereClause.curriculum = { id: curriculumId };
      }

      const tenantSubjects = await queryRunner.manager.find(TenantSubject, {
        where: whereClause,
        relations: ['tenant', 'curriculum', 'subject'],
        order: { subject: { name: 'ASC' } }
      });

      await this.cacheProvider.set(cacheKey, tenantSubjects, 3600); // Cache for 1 hour
      return tenantSubjects;

    } finally {
      await queryRunner.release();
    }
  }


  private async invalidateCache(tenantId: string): Promise<void> {
    await this.cacheProvider.invalidateByPattern(`tenant_subjects:${tenantId}*`);
  }
}

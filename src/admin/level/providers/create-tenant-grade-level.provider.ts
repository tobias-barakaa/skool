import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GradeLevel } from '../entities/grade-level.entity';
import { Curriculum } from '../../curriculum/entities/curicula.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { CacheProvider } from 'src/common/providers/cache.provider';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';

export interface CreateTenantGradeLevelDto {
  tenantId: string;
  curriculumId: string;
  gradeLevelId: string;
}

@Injectable()
export class CreateTenantGradeLevelProvider {
  private readonly logger = new Logger(CreateTenantGradeLevelProvider.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly cacheProvider: CacheProvider,
  ) {}

  async createTenantGradeLevel(
    dto: CreateTenantGradeLevelDto,
  ): Promise<TenantGradeLevel> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate tenant exists
      const tenant = await queryRunner.manager.findOne(Tenant, {
        where: { id: dto.tenantId },
      });

      if (!tenant) {
        throw new BadRequestException('Tenant not found');
      }

      // Validate curriculum exists
      const curriculum = await queryRunner.manager.findOne(Curriculum, {
        where: { id: dto.curriculumId },
      });

      if (!curriculum) {
        throw new BadRequestException('Curriculum not found');
      }

      // Validate grade level exists
      const gradeLevel = await queryRunner.manager.findOne(GradeLevel, {
        where: { id: dto.gradeLevelId },
        relations: ['streams'],
      });

      if (!gradeLevel) {
        throw new BadRequestException('Grade level not found');
      }

      // Check if tenant grade level already exists
      const existingTenantGradeLevel = await queryRunner.manager.findOne(
        TenantGradeLevel,
        {
          where: {
            tenant: { id: dto.tenantId },
            curriculum: { id: dto.curriculumId },
            gradeLevel: { id: dto.gradeLevelId },
          },
        },
      );

      if (existingTenantGradeLevel) {
        if (existingTenantGradeLevel.isActive) {
          throw new BadRequestException(
            'Tenant grade level already exists and is active',
          );
        }

        // Reactivate existing tenant grade level
        existingTenantGradeLevel.isActive = true;
        existingTenantGradeLevel.updatedAt = new Date();

        const result = await queryRunner.manager.save(
          TenantGradeLevel,
          existingTenantGradeLevel,
        );

        await queryRunner.commitTransaction();
        await this.invalidateCache(dto.tenantId);

        return result;
      }

      // Create new tenant grade level
      const tenantGradeLevel = queryRunner.manager.create(TenantGradeLevel, {
        tenant: { id: dto.tenantId },
        curriculum: { id: dto.curriculumId },
        gradeLevel: { id: dto.gradeLevelId },
        isActive: true,
      });

      const result = await queryRunner.manager.save(
        TenantGradeLevel,
        tenantGradeLevel,
      );

      await queryRunner.commitTransaction();
      await this.invalidateCache(dto.tenantId);

      this.logger.log(
        `Created tenant grade level: ${result.id} for tenant: ${dto.tenantId}`,
      );
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to create tenant grade level:', error.message);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteTenantGradeLevel(
    tenantGradeLevelId: string,
    tenantId: string,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find and validate tenant grade level belongs to tenant
      const tenantGradeLevel = await queryRunner.manager.findOne(
        TenantGradeLevel,
        {
          where: {
            id: tenantGradeLevelId,
            tenant: { id: tenantId },
          },
        },
      );

      if (!tenantGradeLevel) {
        throw new NotFoundException(
          'Tenant grade level not found or does not belong to this tenant',
        );
      }

      // Soft delete by setting isActive to false
      tenantGradeLevel.isActive = false;
      tenantGradeLevel.updatedAt = new Date();

      await queryRunner.manager.save(TenantGradeLevel, tenantGradeLevel);

      await queryRunner.commitTransaction();
      await this.invalidateCache(tenantId);

      this.logger.log(
        `Deleted tenant grade level: ${tenantGradeLevelId} for tenant: ${tenantId}`,
      );
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to delete tenant grade level:', error.message);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getTenantGradeLevels(
    tenantId: string,
    curriculumId?: string,
  ): Promise<TenantGradeLevel[]> {
    const cacheKey = `tenant_grade_levels:${tenantId}${curriculumId ? `:${curriculumId}` : ''}`;

    let cached = await this.cacheProvider.get<TenantGradeLevel[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      const whereClause: any = {
        tenant: { id: tenantId },
        isActive: true,
      };

      if (curriculumId) {
        whereClause.curriculum = { id: curriculumId };
      }

      const tenantGradeLevels = await queryRunner.manager.find(
        TenantGradeLevel,
        {
          where: whereClause,
          relations: [
            'tenant',
            'curriculum',
            'gradeLevel',
            'gradeLevel.streams',
          ],
          order: { gradeLevel: { order: 'ASC' } },
        },
      );

      await this.cacheProvider.set(cacheKey, tenantGradeLevels, 3600); // Cache for 1 hour
      return tenantGradeLevels;
    } finally {
      await queryRunner.release();
    }
  }

  async getTenantGradeLevelById(
    tenantGradeLevelId: string,
    tenantId: string,
  ): Promise<TenantGradeLevel | null> {
    const cacheKey = `tenant_grade_level:${tenantGradeLevelId}:${tenantId}`;

    let cached = await this.cacheProvider.get<TenantGradeLevel>(cacheKey);
    if (cached) {
      return cached;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      const tenantGradeLevel = await queryRunner.manager.findOne(
        TenantGradeLevel,
        {
          where: {
            id: tenantGradeLevelId,
            tenant: { id: tenantId },
            isActive: true,
          },
          relations: [
            'tenant',
            'curriculum',
            'gradeLevel',
            'gradeLevel.streams',
          ],
        },
      );

      if (tenantGradeLevel) {
        await this.cacheProvider.set(cacheKey, tenantGradeLevel, 3600); // Cache for 1 hour
      }

      return tenantGradeLevel;
    } finally {
      await queryRunner.release();
    }
  }

  async bulkCreateTenantGradeLevels(
    gradeLevels: CreateTenantGradeLevelDto[],
  ): Promise<TenantGradeLevel[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const results: TenantGradeLevel[] = [];

      for (const dto of gradeLevels) {
        // Check if already exists
        const existing = await queryRunner.manager.findOne(TenantGradeLevel, {
          where: {
            tenant: { id: dto.tenantId },
            curriculum: { id: dto.curriculumId },
            gradeLevel: { id: dto.gradeLevelId },
          },
        });

        if (existing) {
          if (!existing.isActive) {
            existing.isActive = true;
            existing.updatedAt = new Date();
            results.push(
              await queryRunner.manager.save(TenantGradeLevel, existing),
            );
          } else {
            results.push(existing);
          }
        } else {
          const tenantGradeLevel = queryRunner.manager.create(
            TenantGradeLevel,
            {
              tenant: { id: dto.tenantId },
              curriculum: { id: dto.curriculumId },
              gradeLevel: { id: dto.gradeLevelId },
              isActive: true,
            },
          );

          results.push(
            await queryRunner.manager.save(TenantGradeLevel, tenantGradeLevel),
          );
        }
      }

      await queryRunner.commitTransaction();

      // Invalidate cache for all affected tenants
      const tenantIds = [...new Set(gradeLevels.map((gl) => gl.tenantId))];
      for (const tenantId of tenantIds) {
        await this.invalidateCache(tenantId);
      }

      this.logger.log(`Bulk created ${results.length} tenant grade levels`);
      return results;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        'Failed to bulk create tenant grade levels:',
        error.message,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getGradeLevelsWithTenantStreams(
    tenantId: string,
    curriculumId?: string,
  ): Promise<any[]> {
    const cacheKey = `tenant_grade_levels_with_streams:${tenantId}${curriculumId ? `:${curriculumId}` : ''}`;

    let cached = await this.cacheProvider.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Get tenant grade levels
      const whereClause: any = {
        tenant: { id: tenantId },
        isActive: true,
      };

      if (curriculumId) {
        whereClause.curriculum = { id: curriculumId };
      }

      const tenantGradeLevels = await queryRunner.manager.find(
        TenantGradeLevel,
        {
          where: whereClause,
          relations: ['tenant', 'curriculum', 'gradeLevel'],
          order: { gradeLevel: { order: 'ASC' } },
        },
      );

      // Get tenant streams for each grade level
      const results: (TenantGradeLevel & { streams: any[] })[] = [];
      for (const tgl of tenantGradeLevels) {
        const tenantStreams = await queryRunner.manager
          .createQueryBuilder()
          .select('ts')
          .from('tenant_stream', 'ts')
          .leftJoinAndSelect('ts.stream', 'stream')
          .where('ts.tenant_grade_level_id = :tenantGradeLevelId', {
            tenantGradeLevelId: tgl.id,
          })
          .andWhere('ts.is_active = true')
          .getMany();

        results.push({
          ...tgl,
          streams: tenantStreams.map((ts) => ts.stream),
        });
      }

      await this.cacheProvider.set(cacheKey, results, 3600); // Cache for 1 hour
      return results;
    } finally {
      await queryRunner.release();
    }
  }

  private async invalidateCache(tenantId: string): Promise<void> {
    await this.cacheProvider.invalidateByPattern(
      `tenant_grade_level*:*${tenantId}*`,
    );
  }
}

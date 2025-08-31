import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Stream } from '../entities/streams.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TenantStream } from 'src/admin/school-type/entities/tenant-stream';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';
import { CacheProvider } from 'src/common/providers/cache.provider';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { UpdateTenantStreamInput } from '../dtos/update-stream.input';

export interface CreateTenantStreamDto {
  tenantId: string;
  tenantGradeLevelId: string;
  streamId: string;
  isActive?: boolean;
}

@Injectable()
export class CreateTenantStreamProvider {
  private readonly logger = new Logger(CreateTenantStreamProvider.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly cacheProvider: CacheProvider,
  ) {}

  async createTenantStream(dto: CreateTenantStreamDto): Promise<TenantStream> {
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

     
      const tenantGradeLevel = await queryRunner.manager.findOne(
        TenantGradeLevel,
        {
          where: {
            id: dto.tenantGradeLevelId,
            tenant: { id: dto.tenantId },
          },
          relations: ['tenant', 'gradeLevel'],
        },
      );

      if (!tenantGradeLevel) {
        throw new BadRequestException(
          'Tenant grade level not found or does not belong to this tenant',
        );
      }

      // Validate stream exists
      const stream = await queryRunner.manager.findOne(Stream, {
        where: { id: dto.streamId },
      });

      if (!stream) {
        throw new BadRequestException('Stream not found');
      }

      // Check if tenant stream already exists
      const existingTenantStream = await queryRunner.manager.findOne(
        TenantStream,
        {
          where: {
            tenant: { id: dto.tenantId },
            tenantGradeLevel: { id: dto.tenantGradeLevelId },
            stream: { id: dto.streamId },
          },
        },
      );

      if (existingTenantStream) {
        if (existingTenantStream.isActive) {
          throw new BadRequestException(
            'Tenant stream already exists and is active',
          );
        }

        // Reactivate existing tenant stream
        existingTenantStream.isActive = true;
        existingTenantStream.updatedAt = new Date();
        const result = await queryRunner.manager.save(
          TenantStream,
          existingTenantStream,
        );

        await queryRunner.commitTransaction();
        await this.invalidateCache(dto.tenantId);

        this.logger.log(
          `Reactivated tenant stream: ${result.id} for tenant: ${dto.tenantId}`,
        );
        return result;
      }

      // Create new tenant stream
      const tenantStream = queryRunner.manager.create(TenantStream, {
        tenant: { id: dto.tenantId },
        tenantGradeLevel: { id: dto.tenantGradeLevelId },
        stream: { id: dto.streamId },
        isActive: true,
      });

      const result = await queryRunner.manager.save(TenantStream, tenantStream);

      await queryRunner.commitTransaction();
      await this.invalidateCache(dto.tenantId);

      this.logger.log(
        `Created tenant stream: ${result.id} for tenant: ${dto.tenantId}`,
      );
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to create tenant stream:', error.message);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }


  async deleteTenantStream(
    tenantStreamId: string,
    tenantId: string,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find and validate tenant stream belongs to tenant
      const tenantStream = await queryRunner.manager.findOne(TenantStream, {
        where: {
          id: tenantStreamId,
          tenant: { id: tenantId },
        },
      });

      if (!tenantStream) {
        throw new NotFoundException(
          'Tenant stream not found or does not belong to this tenant',
        );
      }

      // Soft delete by setting isActive to false
      tenantStream.isActive = false;
      tenantStream.updatedAt = new Date();

      await queryRunner.manager.save(TenantStream, tenantStream);

      await queryRunner.commitTransaction();
      await this.invalidateCache(tenantId);

      this.logger.log(
        `Deleted tenant stream: ${tenantStreamId} for tenant: ${tenantId}`,
      );
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to delete tenant stream:', error.message);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getTenantStreams(
    tenantId: string,
    tenantGradeLevelId?: string,
  ): Promise<TenantStream[]> {
    const cacheKey = `tenant_streams:${tenantId}${tenantGradeLevelId ? `:${tenantGradeLevelId}` : ''}`;

    let cached = await this.cacheProvider.get<TenantStream[]>(cacheKey);
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

      if (tenantGradeLevelId) {
        whereClause.tenantGradeLevel = { id: tenantGradeLevelId };
      }

      const tenantStreams = await queryRunner.manager.find(TenantStream, {
        where: whereClause,
        relations: ['tenant', 'tenantGradeLevel', 'stream'],
        order: { createdAt: 'ASC' },
      });

      await this.cacheProvider.set(cacheKey, tenantStreams, 3600);
      return tenantStreams;
    } finally {
      await queryRunner.release();
    }
  }

  private async invalidateCache(tenantId: string): Promise<void> {
    await this.cacheProvider.invalidateByPattern(`tenant_streams:${tenantId}*`);
  }
}

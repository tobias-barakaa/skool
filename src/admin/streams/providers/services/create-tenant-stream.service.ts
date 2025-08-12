import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { TenantStream } from 'src/admin/school-type/entities/tenant-stream';
import { CreateTenantStreamDto, CreateTenantStreamProvider } from '../create-tenant-stream.provider';
import { CacheProvider } from 'src/common/providers/cache.provider';
import { DataSource } from 'typeorm';
import { CreateTenantStreamInput } from '../../dtos/create-stream.input';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';
import { Stream } from '../../entities/streams.entity';


@Injectable()
export class CreateTenantStreamService {
  private readonly logger = new Logger(CreateTenantStreamService.name);

  constructor(
    private readonly createTenantStreamProvider: CreateTenantStreamProvider,
    private readonly dataSource: DataSource,
    private readonly cacheProvider: CacheProvider,
  ) {}

  private async invalidateCache(tenantId: string): Promise<void> {
    await this.cacheProvider.invalidateByPattern(`tenant_streams:${tenantId}*`);
  }

  async createTenantStreamFromScratch(
    dto: CreateTenantStreamInput,
    user: ActiveUserData,
  ): Promise<TenantStream> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // 1. Tenant must exist
      const tenant = await qr.manager.findOne(Tenant, {
        where: { id: user.tenantId },
      });
      if (!tenant) {
        throw new BadRequestException('Tenant not found');
      }

      // 2. TenantGradeLevel must exist and belong to this tenant
      const tenantGradeLevel = await qr.manager.findOne(TenantGradeLevel, {
        where: { id: dto.tenantGradeLevelId, tenant: { id: user.tenantId } },
        relations: ['gradeLevel'],
      });
      if (!tenantGradeLevel) {
        throw new BadRequestException(
          'Tenant grade level not found or does not belong to this tenant',
        );
      }

      // 3. Create the global Stream (scoped to tenant)
      const stream = qr.manager.create(Stream, {
        name: dto.name,
        capacity: dto.capacity,
        description: dto.description,
        gradeLevel: tenantGradeLevel.gradeLevel, // underlying global GradeLevel
        tenant,
      });
      const createdStream = await qr.manager.save(Stream, stream);

      // 4. Create TenantStream that links Tenant ↔ TenantGradeLevel ↔ Stream
      const tenantStream = qr.manager.create(TenantStream, {
        tenant,
        tenantGradeLevel,
        stream: createdStream,
        isActive: true,
      });
      const result = await qr.manager.save(TenantStream, tenantStream);

      await qr.commitTransaction();
      await this.invalidateCache(user.tenantId);

      this.logger.log(
        `Created new stream "${result.stream.name}" for tenant ${user.tenantId}`,
      );
      return result;
    } catch (err) {
      await qr.rollbackTransaction();
      this.logger.error(err);
      throw err;
    } finally {
      await qr.release();
    }
  }

  async deleteTenantStream(
    tenantStreamId: string,
    tenantId: string,
  ): Promise<boolean> {
    this.logger.log(
      `Deleting tenant stream: ${tenantStreamId} for tenant: ${tenantId}`,
    );
    return await this.createTenantStreamProvider.deleteTenantStream(
      tenantStreamId,
      tenantId,
    );
  }

  async getTenantStreams(
    tenantId: string,
    tenantGradeLevelId?: string,
  ): Promise<TenantStream[]> {
    this.logger.log(`Getting tenant streams for tenant: ${tenantId}`);
    return await this.createTenantStreamProvider.getTenantStreams(
      tenantId,
      tenantGradeLevelId,
    );
  }
}



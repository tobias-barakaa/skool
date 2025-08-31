import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TenantStream } from 'src/admin/school-type/entities/tenant-stream';
import { CreateTenantStreamDto, CreateTenantStreamProvider } from '../create-tenant-stream.provider';
import { CacheProvider } from 'src/common/providers/cache.provider';
import { DataSource, Repository } from 'typeorm';
import { CreateTenantStreamInput } from '../../dtos/create-stream.input';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';
import { Stream } from '../../entities/streams.entity';
import { UpdateTenantStreamInput } from '../../dtos/update-stream.input';
import { InjectRepository } from '@nestjs/typeorm';


@Injectable()
export class CreateTenantStreamService {
  private readonly logger = new Logger(CreateTenantStreamService.name);

  constructor(
    private readonly createTenantStreamProvider: CreateTenantStreamProvider,
    private readonly dataSource: DataSource,
    private readonly cacheProvider: CacheProvider,

    @InjectRepository(TenantStream)
    private readonly tenantStreamRepo: Repository<TenantStream>, 
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
      const tenant = await qr.manager.findOne(Tenant, {
        where: { id: user.tenantId },
      });
      if (!tenant) {
        throw new BadRequestException('Tenant not found');
      }

      const tenantGradeLevel = await qr.manager.findOne(TenantGradeLevel, {
        where: { id: dto.tenantGradeLevelId, tenant: { id: user.tenantId } },
        relations: ['gradeLevel'],
      });
      if (!tenantGradeLevel) {
        throw new BadRequestException(
          'Tenant grade level not found or does not belong to this tenant',
        );
      }

      const existing = await qr.manager.findOne(TenantStream, {
        where: {
          tenant: { id: user.tenantId },
          tenantGradeLevel: { id: tenantGradeLevel.id },
          stream: { name: dto.name },
        },
        relations: ['stream'],
      });

      if (existing) {
        throw new BadRequestException(
          `Stream with name "${dto.name}" already exists for this grade level.`,
        );
      }

      const stream = qr.manager.create(Stream, {
        name: dto.name,
        capacity: dto.capacity,
        description: dto.description,
        gradeLevel: tenantGradeLevel.gradeLevel,
        tenant,
      });
      const createdStream = await qr.manager.save(Stream, stream);

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

  async updateTenantStream(
    id: string,
    user: ActiveUserData,
    input: UpdateTenantStreamInput,
  ): Promise<TenantStream> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const stream = await qr.manager.findOne(TenantStream, {
        where: { id, tenant: { id: user.tenantId } },
        relations: ['stream', 'tenantGradeLevel'],
      });
      if (!stream) throw new NotFoundException('Stream not found');

      Object.assign(stream, input);
      const updated = await qr.manager.save(TenantStream, stream);

      await qr.commitTransaction();
      await this.invalidateCache(user.tenantId);
      this.logger.log(`Updated tenant stream ${updated.id}`);
      return updated;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async toggleActive(
    id: string,
    user: ActiveUserData,
    activate: boolean,
  ): Promise<boolean> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const stream = await qr.manager.findOne(TenantStream, {
        where: { id, tenant: { id: user.tenantId } },
      });
      if (!stream) throw new NotFoundException('Stream not found');

      stream.isActive = activate;
      await qr.manager.save(TenantStream, stream);

      await qr.commitTransaction();
      await this.invalidateCache(user.tenantId);
      this.logger.log(
        `${activate ? 'Activated' : 'Deactivated'} tenant stream ${id}`,
      );
      return true;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async findAllByTenant(tenantId: string): Promise<TenantStream[]> {
    return this.tenantStreamRepo.find({
      where: { tenant: { id: tenantId }, isActive: true },
      relations: [
        'stream',
        'tenantGradeLevel',
        'tenantGradeLevel.gradeLevel',
        'tenant',
      ],
      order: { createdAt: 'DESC' },
    });
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

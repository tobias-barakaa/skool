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
      const tenantId = user.tenantId;
      if(!tenantId) {
        throw new NotFoundException("Tenant not found");
      }
      const tenant = await qr.manager.findOne(Tenant, {
        where: { id: tenantId },
      });
      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }
     

      const tenantGradeLevel = await qr.manager.findOne(TenantGradeLevel, {
        where: { id: dto.tenantGradeLevelId, tenant: { id: tenantId } },
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
      await this.invalidateCache(tenantId);

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

      const tenantId = user.tenantId;
      if(!tenantId) {
        throw new NotFoundException("Tenant not found");
      }
      const stream = await qr.manager.findOne(TenantStream, {
        where: { id, tenant: { id: tenantId } },
        relations: ['stream', 'tenantGradeLevel'],
      });
      if (!stream) throw new NotFoundException('Stream not found');

      Object.assign(stream, input);
      const updated = await qr.manager.save(TenantStream, stream);

      await qr.commitTransaction();
      await this.invalidateCache(tenantId);
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

      const tenantId = user.tenantId;
      if(!tenantId) {
        throw new NotFoundException("Tenant not found");
      }
      const stream = await qr.manager.findOne(TenantStream, {
        where: { id, tenant: { id: user.tenantId } },
      });
      if (!stream) throw new NotFoundException('Stream not found');

      stream.isActive = activate;
      await qr.manager.save(TenantStream, stream);

      await qr.commitTransaction();
      await this.invalidateCache(tenantId);
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

  async findAllByTenant(user: ActiveUserData): Promise<TenantStream[]> {
    return this.tenantStreamRepo.find({
      where: { tenant: { id: user.tenantId }, isActive: true },
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
    user: ActiveUserData,
  ): Promise<boolean> {
    const tenantId = user.tenantId;

    if(!tenantId) {
      throw new NotFoundException("Tenant not found");
    }
    this.logger.log(
      `Deleting tenant stream: ${tenantStreamId} for tenant: ${user.tenantId}`,
    );
    return await this.createTenantStreamProvider.deleteTenantStream(
      tenantStreamId,
      tenantId
    );
  }

  async getTenantStreams(
    user: ActiveUserData,
    tenantGradeLevelId?: string,
  ): Promise<TenantStream[]> {
    const tenantId = user.tenantId;

    if(!tenantId) {
      throw new NotFoundException(`Not found tenantId `)
    }
    this.logger.log(`Getting tenant streams for tenant: ${user.tenantId}`);
    return await this.createTenantStreamProvider.getTenantStreams(
      tenantId,
      tenantGradeLevelId,
    );
  }
}

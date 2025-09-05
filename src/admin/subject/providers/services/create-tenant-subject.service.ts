import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateTenantSubjectDto, CreateTenantSubjectProvider, UpdateTenantSubjectDto } from '../create-tenant-subject.provider';
import { TenantSubject } from 'src/admin/school-type/entities/tenant-specific-subject';
import { DataSource, Repository } from 'typeorm';
import { CustomSubject } from '../../entities/cusotm-subject.entity';
import { SchoolConfig } from 'src/admin/school-type/entities/school-config.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCustomSubjectInput } from '../../dtos/create-custom-subject.input';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { SubjectTypeEnum, UpdateTenantSubjectInput } from '../../dtos/tenant-subject.input';
import { CacheProvider } from 'src/common/providers/cache.provider';


@Injectable()
export class CreateTenantSubjectService {
  private readonly logger = new Logger(CreateTenantSubjectService.name);

  constructor(
    private readonly createTenantSubjectProvider: CreateTenantSubjectProvider,

    private readonly dataSource: DataSource,
    @InjectRepository(CustomSubject)
    private readonly customSubjectRepo: Repository<CustomSubject>,
    @InjectRepository(TenantSubject)
    private readonly tenantSubjectRepo: Repository<TenantSubject>,
    @InjectRepository(SchoolConfig)
    private readonly schoolConfigRepo: Repository<SchoolConfig>,
    private readonly cacheProvider: CacheProvider,
  ) {}

  private async invalidateCache(tenantId: string): Promise<void> {
    await this.cacheProvider.invalidateByPattern(`tenant_streams:${tenantId}*`);
  }

  async create(
    input: CreateCustomSubjectInput,
    user: ActiveUserData,
  ): Promise<TenantSubject> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // 1.  Make sure the tenant is configured
      const schoolConfig = await qr.manager.findOne(SchoolConfig, {
        where: { tenant: { id: user.tenantId } },
      });
      console.log(schoolConfig, 'this is the schoolconfig /////$$$$$$$$$$$$');
      if (!schoolConfig) {
        throw new BadRequestException('Tenant has no school configuration');
      }

      console.log('Creating custom subject for tenant:', user.tenantId); // new log statement

      const custom = qr.manager.create(CustomSubject, {
        ...input,
        tenant: { id: user.tenantId },
        subjectType: input.subjectType as SubjectTypeEnum,
      });
      const savedCustom = await qr.manager.save(CustomSubject, custom);

      // 3.  Create TenantSubject pointing to the custom row
      const tenantSubject = qr.manager.create(TenantSubject, {
        tenant: { id: user.tenantId },
        curriculum: { id: input.curriculumId },
        customSubject: savedCustom,
        subjectType: input.subjectType,
        isCompulsory: input.isCompulsory,
        totalMarks: input.totalMarks,
        passingMarks: input.passingMarks,
        creditHours: input.creditHours,
        isActive: true,
      });

      const result = await qr.manager.save(TenantSubject, tenantSubject);

      await qr.commitTransaction();
      this.logger.log(
        `Custom subject ${result.id} created for tenant ${user.tenantId}`,
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

  async update(
    tenantSubjectId: string,
    user: ActiveUserData,
    input: UpdateTenantSubjectInput,
  ): Promise<TenantSubject> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
  
    try {
      // 1. Tenant must exist
      const schoolConfig = await qr.manager.findOne(SchoolConfig, {
        where: { tenant: { id: user.tenantId } },
      });
      if (!schoolConfig) {
        throw new BadRequestException('Tenant has no school configuration');
      }
  
      // 2. Load the TenantSubject row
      const tenantSubject = await qr.manager.findOne(TenantSubject, {
        where: { id: tenantSubjectId, tenant: { id: user.tenantId } },
        relations: ['curriculum'],
      });
  
      if (!tenantSubject) {
        throw new NotFoundException('TenantSubject not found');
      }
  
      // 3. Update TenantSubject fields freely
      Object.assign(tenantSubject, input);
  
      const updated = await qr.manager.save(TenantSubject, tenantSubject);
  
      // 4. Commit & clear cache
      await qr.commitTransaction();
      await this.invalidateCache(user.tenantId);
      this.logger.log(`Updated tenant subject ${updated.id}`);
  
      return updated;
    } catch (err) {
      await qr.rollbackTransaction();
      this.logger.error(err);
      throw err;
    } finally {
      await qr.release();
    }
  }

  async deactivate(
    tenantSubjectId: string,
    user: ActiveUserData,
  ): Promise<boolean> {
    const ts = await this.tenantSubjectRepo.findOne({
      where: { id: tenantSubjectId, tenant: { id: user.tenantId } },
    });
    if (!ts) throw new NotFoundException('Subject not found');
    ts.isActive = false;
    await this.tenantSubjectRepo.save(ts);
    await this.invalidateCache(user.tenantId);
    return true;
  }

  async getDeactivatedSubjects(user: ActiveUserData): Promise<TenantSubject[]> {
    return this.tenantSubjectRepo.find({
      where: { tenant: { id: user.tenantId }, isActive: false },
      relations: ['customSubject', 'curriculum'],
    });
  }

  async activate(
    tenantSubjectId: string,
    user: ActiveUserData,
  ): Promise<boolean> {
    const ts = await this.tenantSubjectRepo.findOne({
      where: { id: tenantSubjectId, tenant: { id: user.tenantId } },
    });

    if (!ts) throw new NotFoundException('Subject not found');
    ts.isActive = true;
    await this.tenantSubjectRepo.save(ts);
    await this.invalidateCache(user.tenantId);
    return true;
  }

  async delete(
    tenantSubjectId: string,
    user: ActiveUserData,
  ): Promise<boolean> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
  
    try {
      const ts = await qr.manager.findOne(TenantSubject, {
        where: { id: tenantSubjectId, tenant: { id: user.tenantId } },
      });
  
      if (!ts) {
        throw new NotFoundException('TenantSubject not found');
      }
  
      await qr.manager.remove(TenantSubject, ts);
  
      await qr.commitTransaction();
      await this.invalidateCache(user.tenantId);
      this.logger.log(`Hard-deleted tenant subject ${tenantSubjectId}`);
  
      return true;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async findAllByTenant(user: ActiveUserData): Promise<TenantSubject[]> {
    return this.tenantSubjectRepo.find({
      where: { tenant: { id: user.tenantId }, isActive: true },
      relations: [
        'curriculum',
        'subject',
        'customSubject',
        'customSubject.curriculum',
        'customSubject.tenant',
      ],
      order: { createdAt: 'DESC' },
    });
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

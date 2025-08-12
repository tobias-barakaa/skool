import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateTenantSubjectDto, CreateTenantSubjectProvider, UpdateTenantSubjectDto } from '../create-tenant-subject.provider';
import { TenantSubject } from 'src/admin/school-type/entities/tenant-specific-subject';
import { DataSource, Repository } from 'typeorm';
import { CustomSubject } from '../../entities/cusotm-subject.entity';
import { SchoolConfig } from 'src/admin/school-type/entities/school-config.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCustomSubjectInput } from '../../dtos/create-custom-subject.input';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { SubjectTypeEnum } from '../../dtos/tenant-subject.input';


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
  ) {}

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
      console.log(schoolConfig, 'this is the schoolconfig /////$$$$$$$$$$$$')
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

import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { DataSource, Repository } from 'typeorm';
import { SchoolConfig } from '../entities/school-config.entity';
import { SchoolConfigProvider } from '../providers/school-config.provider';
import { SchoolConfigurationResponse } from '../dtos/config/school-configuration.response';
import { CacheProvider } from 'src/common/providers/cache.provider';
import { TenantGradeLevel } from '../entities/tenant-grade-level';
import { TenantSubject } from '../entities/tenant-specific-subject';
import { TenantStream } from '../entities/tenant-stream';
import { CustomSubject } from 'src/admin/subject/entities/cusotm-subject.entity';

@Injectable()
export class SchoolConfigService {
  private readonly logger = new Logger(SchoolConfigService.name);

  constructor(
    @InjectRepository(SchoolConfig)
    private readonly schoolConfigRepo: Repository<SchoolConfig>,

    @InjectRepository(TenantSubject)
    private readonly tenantSubjectRepo: Repository<TenantSubject>,

    @InjectRepository(TenantGradeLevel)
    private readonly tenantGradeLevelRepo: Repository<TenantGradeLevel>,

    @InjectRepository(TenantStream)
    private readonly tenantStreamRepo: Repository<TenantStream>,

    @InjectRepository(CustomSubject)
    private readonly customSubjectRepo: Repository<CustomSubject>,

    private readonly schoolConfigProvider: SchoolConfigProvider,
    private readonly cacheProvider: CacheProvider,
    private readonly dataSource: DataSource,
  ) {}

  async configureSchoolLevelsByNames(
    levelNames: string[],
    user: ActiveUserData,
  ): Promise<SchoolConfigurationResponse> {
    const lockKey = `school_config_lock:${user.tenantId}`;
    const lockValue = `${Date.now()}-${Math.random()}`;
    const lockTTL = 30;

    try {
      const lockAcquired = await this.cacheProvider.acquireLock(
        lockKey,
        lockValue,
        lockTTL,
      );
      if (!lockAcquired) {
        throw new BadRequestException(
          'School configuration is currently being processed. Please try again.',
        );
      }

      return await this.dataSource.transaction(async (manager) => {
        const tenant = await this.schoolConfigProvider.findTenantById(
          user.tenantId,
        );
        if (!tenant) {
          throw new BadRequestException('Tenant not found');
        }

        const existing = await manager.findOne(SchoolConfig, {
          where: { tenant: { id: tenant.id }, isActive: true },
        });

        if (existing) {
          const existingGradeLevels = await manager.count(TenantGradeLevel, {
            where: { tenant: { id: tenant.id }, isActive: true },
          });

          if (existingGradeLevels > 0) {
            throw new BadRequestException('School is already configured');
          }
        }

        const { levels, schoolType } =
          await this.schoolConfigProvider.validateLevelsAndSchoolType(
            levelNames,
          );

        let config = existing;
        if (!config) {
          config = manager.create(SchoolConfig, {
            tenant: { id: tenant.id },
            schoolType: { id: schoolType.id },
            isActive: true,
          });
          config = await manager.save(config);
        }

        await manager.delete(TenantGradeLevel, { tenant: { id: tenant.id } });
        await manager.delete(TenantSubject, { tenant: { id: tenant.id } });
        await manager.delete(TenantStream, { tenant: { id: tenant.id } });

        for (const curriculum of levels) {
          // const tenantGradeLevels = curriculum.gradeLevels.map((gradeLevel) =>
          //   manager.create(TenantGradeLevel, {
          //     tenant: { id: tenant.id },
          //     curriculum: { id: curriculum.id },
          //     gradeLevel: { id: gradeLevel.id },
          //     isActive: true,
          //   }),
          // );


          const tenantGradeLevels = curriculum.gradeLevels.map((gradeLevel) =>
            manager.create(TenantGradeLevel, {
              tenant: { id: tenant.id },
              curriculum: { id: curriculum.id },
              gradeLevel: { id: gradeLevel.id },
              name: gradeLevel.name,
              isActive: true,
            }),
          );
          const savedGradeLevels = await manager.save(tenantGradeLevels);

          const tenantSubjects = curriculum.curriculumSubjects.map((cs) =>
            manager.create(TenantSubject, {
              tenant: { id: tenant.id },
              curriculum: { id: curriculum.id },
              subject: { id: cs.subject.id },
              subjectType: cs.subjectType as 'core' | 'elective',
              isCompulsory: cs.isCompulsory,
              totalMarks: cs.totalMarks,
              passingMarks: cs.passingMarks,
              creditHours: cs.creditHours,
              isActive: true,
            }),
          );
          await manager.save(tenantSubjects);

          

          for (const savedGradeLevel of savedGradeLevels) {
            const streams = savedGradeLevel.gradeLevel.streams || [];
            const tenantStreams = streams.map((stream) =>
              manager.create(TenantStream, {
                tenant: { id: tenant.id },
                tenantGradeLevel: { id: savedGradeLevel.id },
                stream: { id: stream.id },
                isActive: true,
              }),
            );
            if (tenantStreams.length > 0) {
              await manager.save(tenantStreams);
            }
          }
        }

        const finalConfig = await this.loadCompleteConfiguration(
          manager,
          config.id,
          tenant.id,
        );
        return this.mapToSchoolConfigurationResponse(finalConfig, tenant.id);
      });
    } finally {
      await this.cacheProvider.releaseLock(lockKey, lockValue);
      await this.schoolConfigProvider.invalidateConfigCache(user.tenantId);
    }
  }

  private async loadCompleteConfiguration(
    manager: any,
    configId: string,
    tenantId: string,
  ) {
    return await manager.findOne(SchoolConfig, {
      where: { id: configId },
      relations: ['tenant', 'schoolType'],
    });
  }
  private async mapToSchoolConfigurationResponse(
    config: SchoolConfig,
    tenantId: string,
  ): Promise<SchoolConfigurationResponse> {
    if (!config) throw new Error('School configuration is null');
  
    const tenantGradeLevels = await this.tenantGradeLevelRepo.find({
      where: { tenant: { id: tenantId }, isActive: true },
      relations: ['curriculum', 'gradeLevel', 'tenantStreams', 'tenantStreams.stream'],
      order: { gradeLevel: { order: 'ASC' } },
    });
  
    const tenantSubjects = await this.tenantSubjectRepo.find({
      where: { tenant: { id: tenantId }, isActive: true },
      relations: ['curriculum', 'subject', 'customSubject'],
    });
  
    const curriculumMap = new Map();
    
    tenantGradeLevels.forEach((tgl) => {
      const cid = tgl.curriculum.id;
      if (!curriculumMap.has(cid)) {
        curriculumMap.set(cid, {
          curriculum: tgl.curriculum,
          gradeLevels: [],
          subjects: [],
        });
      }
  
    
      const gradeLevel = {
        id: tgl.id, 
        name: tgl.gradeLevel.name,
        shortName: tgl.shortName,
        sortOrder: tgl.sortOrder,
        age: tgl.gradeLevel.age,
        streams: tgl.tenantStreams?.map(ts => ts.stream) || [],
      };
  
      curriculumMap.get(cid).gradeLevels.push(gradeLevel);
    });
  
   
    tenantSubjects.forEach((ts) => {
      if (!ts.curriculum) return;
  
      const cid = ts.curriculum.id;
      if (!curriculumMap.has(cid)) return;
      
      if (ts.subject) {
        curriculumMap.get(cid).subjects.push({
          id: ts.subject.id,
          name: ts.subject.name,
          code: ts.subject.code,
          subjectType: ts.subjectType,
          category: ts.subject.category,
          department: ts.subject.department,
          shortName: ts.subject.shortName,
          isCompulsory: ts.isCompulsory,
          totalMarks: ts.totalMarks,
          passingMarks: ts.passingMarks,
          creditHours: ts.creditHours,
          curriculum: ts.curriculum.id,
          isCustom: false,
        });
      }
  
      if (ts.customSubject) {
        const cs = ts.customSubject;
        curriculumMap.get(cid).subjects.push({
          id: cs.id,
          name: cs.name,
          code: cs.code,
          subjectType: ts.subjectType,
          category: cs.category,
          department: cs.department,
          shortName: cs.shortName,
          isCompulsory: ts.isCompulsory,
          totalMarks: ts.totalMarks,
          passingMarks: ts.passingMarks,
          creditHours: ts.creditHours,
          curriculum: ts.curriculum.id,
          isCustom: true,
        });
      }
    });
    
    const selectedLevels = Array.from(curriculumMap.values()).map((item) => ({
      id: item.curriculum.id,
      name: item.curriculum.display_name,
      description: item.curriculum.name,
      gradeLevels: item.gradeLevels.sort(
        (a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0),
      ),
      subjects: item.subjects,
    }));
  
    return {
      id: config.id,
      createdAt: config.createdAt,
      tenant: {
        id: config.tenant.id,
        schoolName: config.tenant.name,
      },
      selectedLevels,
    };
  }

  async getSchoolConfiguration(
    user: ActiveUserData,
  ): Promise<SchoolConfigurationResponse> {
    const config = await this.schoolConfigRepo.findOne({
      where: { tenant: { id: user.tenantId }, isActive: true },
      relations: ['tenant', 'schoolType'],
    });

    if (!config) {
      throw new NotFoundException('School configuration not found');
    }

    return this.mapToSchoolConfigurationResponse(config, user.tenantId);
  }

  async getWholeGradeLevelForSchoolType(
    tenantId: string,
  ): Promise<TenantGradeLevel[]> {
   
    const config = await this.schoolConfigRepo.findOne({
      where: { tenant: { id: tenantId }, isActive: true },
      relations: ['schoolType'],
    });

    if (!config) {
      throw new Error('Tenant has no active school configuration');
    }


return this.tenantGradeLevelRepo
  .createQueryBuilder('tgl')
  .innerJoinAndSelect('tgl.gradeLevel', 'gradeLevel')
  .leftJoinAndSelect('tgl.tenantStreams', 'tenantStreams') 
  .leftJoinAndSelect('tenantStreams.stream', 'stream')    
  .innerJoinAndSelect('tgl.curriculum', 'curriculum')
  .innerJoinAndSelect('curriculum.schoolType', 'schoolType')
  .where('tgl.tenantId = :tenantId', { tenantId })
  .andWhere('tgl.isActive = true')
  .andWhere('curriculum.schoolTypeId = :schoolTypeId', {
    schoolTypeId: config.schoolType.id,
  })
  .orderBy('tgl.sortOrder', 'ASC')
  .getMany();
  }
}




// sudo systemctl enable --now servicename


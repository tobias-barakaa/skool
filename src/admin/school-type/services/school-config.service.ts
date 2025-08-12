import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { DataSource, Repository } from 'typeorm';
import { SchoolConfig } from '../entities/school-config.entity';
// import { SchoolConfigCurriculum } from '../entities/school-config-curriculum.entity';
import { SchoolConfigProvider } from '../providers/school-config.provider';
import { SubjectType } from 'src/admin/subject/enums/subject.type.enum';
import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';
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
        /* 1. Check if tenant exists */
        const tenant = await this.schoolConfigProvider.findTenantById(
          user.tenantId,
        );
        if (!tenant) {
          throw new BadRequestException('Tenant not found');
        }

        /* 2. Check for existing configuration */
        const existing = await manager.findOne(SchoolConfig, {
          where: { tenant: { id: tenant.id }, isActive: true },
        });

        if (existing) {
          // Check if tenant already has grade levels configured
          const existingGradeLevels = await manager.count(TenantGradeLevel, {
            where: { tenant: { id: tenant.id }, isActive: true },
          });

          if (existingGradeLevels > 0) {
            throw new BadRequestException('School is already configured');
          }
        }

        /* 3. Validate levels and school type */
        const { levels, schoolType } =
          await this.schoolConfigProvider.validateLevelsAndSchoolType(
            levelNames,
          );

        /* 4. Create or update SchoolConfig */
        let config = existing;
        if (!config) {
          config = manager.create(SchoolConfig, {
            tenant: { id: tenant.id },
            schoolType: { id: schoolType.id },
            isActive: true,
          });
          config = await manager.save(config);
        }

        /* 5. Clear existing tenant configurations */
        await manager.delete(TenantGradeLevel, { tenant: { id: tenant.id } });
        await manager.delete(TenantSubject, { tenant: { id: tenant.id } });
        await manager.delete(TenantStream, { tenant: { id: tenant.id } });

        /* 6. Create tenant-specific grade levels, subjects, and streams */
        for (const curriculum of levels) {
          // Create tenant grade levels
          const tenantGradeLevels = curriculum.gradeLevels.map((gradeLevel) =>
            manager.create(TenantGradeLevel, {
              tenant: { id: tenant.id },
              curriculum: { id: curriculum.id },
              gradeLevel: { id: gradeLevel.id },
              isActive: true,
            }),
          );
          const savedGradeLevels = await manager.save(tenantGradeLevels);

          // Create tenant subjects
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

          // Create tenant streams for each grade level
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

        /* 7. Load complete configuration for response */
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

    /* 1. Tenant-specific grade levels w/ curriculum & streams */
    const tenantGradeLevels = await this.tenantGradeLevelRepo.find({
      where: { tenant: { id: tenantId }, isActive: true },
      relations: ['curriculum', 'gradeLevel', 'gradeLevel.streams'],
      order: { gradeLevel: { order: 'ASC' } },
    });

    /* 2. Tenant-specific subjects (global + custom) */
    const tenantSubjects = await this.tenantSubjectRepo.find({
      where: { tenant: { id: tenantId }, isActive: true },
      relations: ['curriculum', 'subject', 'customSubject'],
    });

    /* 3. Tenant-specific streams */
    const tenantStreams = await this.tenantStreamRepo.find({
      where: { tenant: { id: tenantId }, isActive: true },
      relations: ['tenantGradeLevel', 'stream'],
    });

    /* 4. Build curriculum map from grade levels */
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
        ...tgl.gradeLevel,
        streams: tenantStreams
          .filter(
            (ts) => ts.tenantGradeLevel.gradeLevel.id === tgl.gradeLevel.id,
          )
          .map((ts) => ts.stream),
      };

      curriculumMap.get(cid).gradeLevels.push(gradeLevel);
    });

    /* 5. Populate subjects (global and custom) */
    tenantSubjects.forEach((ts) => {
      if (!ts.curriculum) return; // skip if no curriculum

      const cid = ts.curriculum.id;
      if (!curriculumMap.has(cid)) return; // curriculum not in map -> skip

      /* 5a. Global subject */
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

      /* 5b. Custom subject */
      if (ts.customSubject) {
        const cs = ts.customSubject;
        curriculumMap.get(cid).subjects.push({
          id: cs.id,
          name: cs.name,
          code: cs.code,
          subjectType: ts.subjectType, // from TenantSubject
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

    /* 6. Build final array */
    const selectedLevels = Array.from(curriculumMap.values()).map((item) => ({
      id: item.curriculum.id,
      name: item.curriculum.display_name,
      description: item.curriculum.name,
      gradeLevels: item.gradeLevels.sort(
        (a, b) => (a.order || 0) - (b.order || 0),
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
}

  // async configureSchoolLevelsByNames(
  //   levelNames: string[],
  //   user: ActiveUserData,
  // ): Promise<SchoolConfigurationResponse> {
  //   // Use Redis-based locking to prevent concurrent configurations
  //   const lockKey = `school_config_lock:${user.tenantId}`;
  //   const lockValue = `${Date.now()}-${Math.random()}`;
  //   const lockTTL = 30; // 30 seconds

  //   try {
  //     // Acquire lock
  //     const lockAcquired = await this.cacheProvider.acquireLock(lockKey, lockValue, lockTTL);
  //     if (!lockAcquired) {
  //       throw new BadRequestException('School configuration is currently being processed. Please try again.');
  //     }

  //     return await this.dataSource.transaction(async (manager) => {
  //       /* 1. Check if tenant exists */
  //       const tenant = await this.schoolConfigProvider.findTenantById(user.tenantId);
  //       if (!tenant) {
  //         throw new BadRequestException('Tenant not found');
  //       }

  //       /* 2. Check for existing configuration - CONSISTENT CHECK */
  //       const existing = await manager.findOne(SchoolConfig, {
  //         where: { tenant: { id: tenant.id }, isActive: true },
  //         relations: ['configCurricula', 'configCurricula.curriculum'],
  //       });

  //       if (existing && existing.configCurricula && existing.configCurricula.length > 0) {
  //         throw new BadRequestException('School is already configured');
  //       }

  //       /* 3. Validate levels and school type */
  //       const { levels, schoolType } =
  //         await this.schoolConfigProvider.validateLevelsAndSchoolType(levelNames);

  //       console.log('REQUESTED LEVEL NAMES:', levelNames);
  //       console.log('FOUND CURRICULA COUNT:', levels.length);
  //       console.log('FOUND CURRICULA NAMES:', levels.map((l) => l.display_name));

  //       /* 4. Create or update SchoolConfig */
  //       let config = existing;

  //       if (!config) {
  //         const fullSchoolType = await manager.findOne(SchoolType, {
  //           where: { id: schoolType.id },
  //         });

  //         if (!fullSchoolType) {
  //           throw new BadRequestException('School type not found');
  //         }

  //         config = manager.create(SchoolConfig, {
  //           tenant: { id: tenant.id },
  //           schoolType: { id: fullSchoolType.id },
  //           isActive: true,
  //         });
  //         config = await manager.save(config);
  //       }

  //       /* 5. Clear existing curricula configurations */
  //       await manager.delete(SchoolConfigCurriculum, {
  //         schoolConfig: { id: config.id },
  //       });

  //       /* 6. Create new curricula configurations */
  //       const configCurricula = levels.map((curriculum) =>
  //         manager.create(SchoolConfigCurriculum, {
  //           schoolConfig: config,
  //           curriculum: curriculum,
  //         }),
  //       );

  //       console.log('SAVING CONFIG CURRICULA COUNT:', configCurricula.length);
  //       const savedCurricula = await manager.save(configCurricula);
  //       console.log('SAVED CURRICULA IDS:', savedCurricula.map((sc) => sc.curriculum.id));

  //       /* 7. Load the complete configuration with relations */
  //       const finalConfig = await manager.findOne(SchoolConfig, {
  //         where: { id: config.id },
  //         relations: [
  //           'tenant',
  //           'schoolType',
  //           'configCurricula',
  //           'configCurricula.curriculum',
  //           'configCurricula.curriculum.gradeLevels',
  //           'configCurricula.curriculum.curriculumSubjects',
  //           'configCurricula.curriculum.curriculumSubjects.subject',
  //         ],
  //       });

  //       if (!finalConfig) {
  //         throw new Error('Failed to retrieve saved configuration');
  //       }

  //       console.log('FINAL CONFIG CURRICULA COUNT:', finalConfig.configCurricula?.length);

  //       return this.mapToSchoolConfigurationResponse(finalConfig);
  //     });
  //   } finally {
  //     // Always release the lock
  //     await this.cacheProvider.releaseLock(lockKey, lockValue);
  //     // Invalidate cache after successful transaction
  //     await this.schoolConfigProvider.invalidateConfigCache(user.tenantId);
  //   }
  // }

  // private async mapToSchoolConfigurationResponse(
  //   config: SchoolConfig,
  // ): Promise<SchoolConfigurationResponse> {
  //   if (!config) throw new Error('School configuration is null');

  //   console.log(
  //     'MAPPING - configCurricula count:',
  //     config.configCurricula?.length,
  //   );

  //   if (!config.configCurricula || config.configCurricula.length === 0) {
  //     console.error('NO CONFIG CURRICULA FOUND TO MAP!');
  //     throw new Error('No curricula configuration found');
  //   }

  //   // Deduplicate by curriculum ID to prevent duplicates
  //   const uniqueConfigCurricula = config.configCurricula.filter(
  //     (cc, index, self) =>
  //       index ===
  //       self.findIndex((item) => item.curriculum.id === cc.curriculum.id),
  //   );

  //   console.log('UNIQUE CONFIG CURRICULA COUNT:', uniqueConfigCurricula.length);

  //   // Build selectedLevels from unique configCurricula
  //   const selectedLevels = uniqueConfigCurricula.map((cc) => {
  //     const curriculum = cc.curriculum;

  //     console.log(
  //       `MAPPING curriculum: ${curriculum.display_name} (ID: ${curriculum.id})`,
  //     );

  //     /* Grade levels from curriculum */
  //     const gradeLevels = (curriculum.gradeLevels || [])
  //       .sort((a, b) => (a.order || 0) - (b.order || 0))
  //       .map((gl) => {
  //         console.log(`  - Grade Level: ${gl.name} (Order: ${gl.order})`);
  //         return {
  //           id: gl.id,
  //           name: gl.name,
  //           code: gl.code,
  //           order: gl.order,
  //           age: gl.age,
  //           streams: (gl.streams || []).map((s) => ({
  //             id: s.id,
  //             name: s.name,
  //           })),
  //         };
  //       });

  //     /* Subjects from curriculum subjects */
  //     const subjects = (curriculum.curriculumSubjects || []).map((cs) => ({
  //       id: cs.subject.id,
  //       name: cs.subject.name,
  //       code: cs.subject.code,
  //       subjectType: cs.subjectType,
  //       category: cs.subject.category,
  //       department: cs.subject.department,
  //       shortName: cs.subject.shortName,
  //       isCompulsory: cs.isCompulsory,
  //       totalMarks: cs.totalMarks,
  //       passingMarks: cs.passingMarks,
  //       creditHours: cs.creditHours,
  //     }));

  //     console.log(`  - Subjects count: ${subjects.length}`);

  //     return {
  //       id: curriculum.id,
  //       name: curriculum.display_name,
  //       description: curriculum.name,
  //       gradeLevels,
  //       subjects,
  //     };
  //   });

  //   console.log('FINAL SELECTED LEVELS COUNT:', selectedLevels.length);
  //   console.log(
  //     'FINAL SELECTED LEVELS NAMES:',
  //     selectedLevels.map((sl) => sl.name),
  //   );

  //   // FLEXIBLE VALIDATION - Just ensure we have some levels
  //   if (selectedLevels.length === 0) {
  //     throw new Error('No valid curricula found in configuration');
  //   }

  //   // Optional: Add reasonable limits if needed for performance/business reasons
  //   if (selectedLevels.length > 20) {
  //     console.warn(
  //       `Large number of levels selected: ${selectedLevels.length}. Consider if this is expected.`,
  //     );
  //   }

  //   return {
  //     id: config.id,
  //     createdAt: config.createdAt,
  //     tenant: {
  //       id: config.tenant.id,
  //       schoolName: config.tenant.name,
  //     },
  //     selectedLevels,
  //   };
  // }

  // async getSchoolConfigurationss(
  //   tenantId: string,
  // ): Promise<SchoolConfigurationReadResponse | null> {
  //   // Find the school configuration for this tenant
  //   const config = await this.dataSource.getRepository(SchoolConfig).findOne({
  //     where: {
  //       tenant: { id: tenantId },
  //       isActive: true,
  //     },
  //     relations: ['tenant'],
  //   });

  //   if (!config) {
  //     console.log('No school configuration found for tenant:', tenantId);
  //     return null;
  //   }

  //   console.log('Found config ID:', config.id);

  //   // Load the specific configCurricula for this config
  //   const configCurriculaWithRelations = await this.dataSource
  //     .getRepository(SchoolConfigCurriculum)
  //     .find({
  //       where: { schoolConfig: { id: config.id } },
  //       relations: [
  //         'curriculum',
  //         'curriculum.gradeLevels',
  //         'curriculum.gradeLevels.streams',
  //         'curriculum.curriculumSubjects',
  //         'curriculum.curriculumSubjects.subject',
  //       ],
  //       order: {
  //         curriculum: { display_name: 'ASC' },
  //       },
  //     });

  //   console.log(
  //     'Found configCurricula count:',
  //     configCurriculaWithRelations.length,
  //   );
  //   console.log(
  //     'ConfigCurricula names:',
  //     configCurriculaWithRelations.map((cc) => cc.curriculum.display_name),
  //   );

  //   if (configCurriculaWithRelations.length === 0) {
  //     console.log('No curricula configured for this school');
  //     return {
  //       id: config.id,
  //       selectedLevels: [],
  //       tenant: {
  //         id: config.tenant.id,
  //         schoolName: config.tenant.name,
  //         subdomain: config.tenant.subdomain,
  //       },
  //       createdAt: config.createdAt,
  //     };
  //   }

  //   // Map to response format
  //   const selectedLevels: SelectedLevelReadResponseGQL[] =
  //     configCurriculaWithRelations.map((cc) => {
  //       const curriculum = cc.curriculum;

  //       console.log(`Mapping curriculum: ${curriculum.display_name}`);

  //       // Map subjects
  //       const subjects: SubjectReadResponseGQL[] = (
  //         curriculum.curriculumSubjects || []
  //       ).map((cs) => ({
  //         id: cs.subject.id,
  //         name: cs.subject.name,
  //         code: cs.subject.code,
  //         subjectType: cs.subjectType,
  //         category: cs.subject.category || '',
  //         department: cs.subject.department || '',
  //         shortName: cs.subject.shortName || '',
  //         isCompulsory: cs.isCompulsory || false,
  //         totalMarks: cs.totalMarks || 0,
  //         passingMarks: cs.passingMarks || 0,
  //         creditHours: cs.creditHours || 0,
  //         curriculum: curriculum.display_name,
  //       }));

  //       // Map grade levels
  //       const gradeLevels: GradeLevelReadResponseGQL[] = (
  //         curriculum.gradeLevels || []
  //       )
  //         .sort((a, b) => (a.order || 0) - (b.order || 0))
  //         .map((gl) => ({
  //           id: gl.id,
  //           name: gl.name,
  //           code: gl.code || '',
  //           order: gl.order || 0,
  //           age: gl.age || 0,
  //           streams: (gl.streams || []).map((s) => ({
  //             id: s.id,
  //             name: s.name,
  //           })),
  //         }));

  //       console.log(
  //         `  - Subjects: ${subjects.length}, Grade Levels: ${gradeLevels.length}`,
  //       );

  //       return {
  //         id: curriculum.id,
  //         name: curriculum.display_name,
  //         description: curriculum.name || curriculum.display_name,
  //         subjects,
  //         gradeLevels,
  //       };
  //     });

  //   console.log(
  //     'Final response - selectedLevels count:',
  //     selectedLevels.length,
  //   );

  //   return {
  //     id: config.id,
  //     selectedLevels,
  //     tenant: {
  //       id: config.tenant.id,
  //       schoolName: config.tenant.name,
  //       subdomain: config.tenant.subdomain,
  //     },
  //     createdAt: config.createdAt,
  //   };
  // }

  //   private mapToSchoolConfigurationReadResponse(
  //   config: SchoolConfig,
  // ): SchoolConfigurationReadResponse {
  //   if (!config) throw new Error('School configuration is null');

  //   return {
  //     id: config.id,
  //     createdAt: config.createdAt,
  //     tenant: {
  //       id: config.tenant.id,
  //       schoolName: config.tenant.name,
  //       subdomain: config.tenant.subdomain || undefined,
  //     },
  //     selectedLevels: config.configLevels.map((cl) => ({
  //       id: cl.level.id,
  //       name: cl.level.name,
  //       description: cl.level.description,
  //       subjects: [],
  //       gradeLevels: [],
  //     })),
  //   };
  // }

  // private mapToSchoolConfigurationReadResponse(
  //   config: SchoolConfig,
  // ): SchoolConfigurationReadResponse {
  //   if (!config) throw new Error('School configuration is null');

  //   /* configLevels is the pivot table we actually have */
  //   const selectedLevels = (config.configLevels || []).map((cl) => {
  //     const level = cl.level;

  //     /* subjects come from cl.subjects (school_config_subject) */
  //     const subjects = (cl.subjects || [])
  //       .filter((cs) => cs.subject)
  //       .map((cs) => ({
  //         id: cs.subject.id,
  //         name: cs.subject.name,
  //         code: cs.subject.code,
  //         subjectType: cs.subjectType,
  //         category: cs.subject.category || '',
  //         department: cs.subject.department || '',
  //         shortName: cs.subject.shortName || '',
  //         isCompulsory: cs.subjectType === 'core',
  //         totalMarks: cs.subject.totalMarks || 0,
  //         passingMarks: cs.subject.passingMarks || 0,
  //         creditHours: cs.subject.creditHours || 0,
  //         curriculum: '',
  //       }));

  //     /* grades come from level.gradeLevels (static table) */
  //     const gradeLevels = (level.gradeLevels || [])
  //       .filter((gl) => gl)
  //       .map((gl) => ({
  //         id: gl.id,
  //         name: gl.name,
  //         code: gl.code,
  //         order: gl.order,
  //         age: gl.age,
  //         streams: (gl.streams || []).map((s) => ({ id: s.id, name: s.name })),
  //       }))
  //       .sort((a, b) => a.order - b.order);

  //     return {
  //       id: level.id,
  //       name: level.name,
  //       description: level.description,
  //       subjects,
  //       gradeLevels,
  //     };
  //   });

  //   return {
  //     id: config.id,
  //     createdAt: config.createdAt,
  //     tenant: {
  //       id: config.tenant.id,
  //       schoolName: config.tenant.name,
  //       subdomain: config.tenant.subdomain || undefined,
  //     },

  //     selectedLevels,
  //   };
  // }

  // async getSchoolConfiguration(
  //   tenantId: string,
  // ): Promise<SchoolConfigurationReadResponse | null> {
  //   await this.schoolConfigProvider.validateTenantExists(tenantId);
  //   const config =
  //     await this.schoolConfigProvider.findCompleteConfigByTenant(tenantId);
  //   if (!config) return null;
  //   return this.mapToSchoolConfigurationReadResponse(config);
  // }

  // async getSchoolConfiguration(
  //   tenantId: string,
  //   // includeDetails = false,
  // ): Promise<SchoolConfigurationReadResponse | null> {
  //   this.logger.log(
  //     `Getting school configuration for tenant: ${tenantId}, includeDetails: `,
  //   );

  //   try {
  //     await this.schoolConfigProvider.validateTenantExists(tenantId);

  //     const config =
  //       await this.schoolConfigProvider.findCompleteConfigByTenant(tenantId);
  //     // : await this.schoolConfigProvider.findBasicConfigByTenant(tenantId);

  //     if (!config) {
  //       this.logger.debug(
  //         `No school configuration found for tenant: ${tenantId}`,
  //       );
  //       return null;
  //     }
  //     return this.mapToSchoolConfigurationReadResponse(config);
  //   } catch (error) {
  //     this.logger.error(
  //       `Error getting school configuration for tenant ${tenantId}:`,
  //       error,
  //     );
  //     throw error;
  //   }
  // }

  // async getBasicSchoolConfiguration(
  //   tenantId: string,
  // ): Promise<SchoolConfigurationReadResponse | null> {
  //   return this.getSchoolConfigurationss(tenantId);
  // }





  // private mapToSchoolConfigurationReadResponse(
  //   config: SchoolConfig,
  // ): SchoolConfigurationReadResponse {
  //   if (!config) throw new Error('School configuration is null');

  //   return {
  //     id: config.id,
  //     createdAt: config.createdAt,
  //     tenant: {
  //       id: config.tenant.id,
  //       schoolName: config.tenant.name,
  //       subdomain: config.tenant.subdomain || undefined,
  //     },
  //     selectedLevels: config.configLevels.map((cl) => ({
  //       id: cl.level.id,
  //       name: cl.level.name,
  //       description: cl.level.description,
  //       subjects: [],
  //       gradeLevels: [],
  //     })),
  //   };
  // }




  // private mapToSchoolConfigurationResponse(
  //   config: SchoolConfig,
  // ): SchoolConfigurationResponse {
  //   if (!config) {
  //     throw new Error('School configuration is null or undefined');
  //   }

  //   if (!config.configLevels) {
  //     throw new Error('School configuration levels are not loaded');
  //   }

  //   return {
  //     id: config.id,
  //     tenant: {
  //       id: config.tenant?.id,
  //       schoolName: config.tenant?.name,
  //     },
  //     selectedLevels: config.configLevels
  //       .filter((cl) => cl.level)
  //       .map((cl) => ({
  //         id: cl.level.id,
  //         name: cl.level.name,
  //         gradeLevels: (cl.gradeLevels || [])
  //           .filter((gl) => gl.gradeLevel)
  //           .map((gl) => ({
  //             id: gl.gradeLevel.id,
  //             name: gl.gradeLevel.name,
  //             code: gl.gradeLevel.code,
  //             order: gl.gradeLevel.order,
  //           })),
  //       })),
  //     createdAt: config.createdAt,
  //   };
  // }

  // async getSchoolConfiguration(
  //   tenantId: string,
  // ): Promise<SchoolConfigurationResponse | null> {
  //   const config = await this.schoolConfigProvider.findExistingConfig(tenantId);
  //   return config ? this.mapToSchoolConfigurationReadResponse(config) : null;
  // }

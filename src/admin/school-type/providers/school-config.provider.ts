import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CurriculumSubject } from 'src/admin/curriculum/entities/curriculum_subjects.entity';
import { Level } from 'src/admin/level/entities/level.entities';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { DataSource, In, Repository } from 'typeorm';
import { SchoolConfig } from '../entities/school-config.entity';
import { SchoolConfigGradeLevel } from '../entities/school_config_grade_level';
import { SchoolConfigLevel } from '../entities/school_config_level';
import { SchoolConfigSubject } from '../entities/school_config_subject';
import { CacheProvider } from 'src/common/providers/cache.provider';
import { Curriculum } from 'src/admin/curriculum/entities/curicula.entity';
import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';

@Injectable()
export class SchoolConfigProvider {
  private readonly logger = new Logger(SchoolConfigProvider.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(SchoolConfig)
    private readonly schoolConfigRepo: Repository<SchoolConfig>,
    @InjectRepository(Level)
    private readonly levelRepo: Repository<Level>,
    @InjectRepository(Curriculum)
    private readonly curriculumRepo: Repository<Curriculum>,
    @InjectRepository(SchoolConfigLevel)
    private readonly schoolConfigLevelRepo: Repository<SchoolConfigLevel>,
    @InjectRepository(SchoolConfigGradeLevel)
    private readonly schoolConfigGradeLevelRepo: Repository<SchoolConfigGradeLevel>,
    @InjectRepository(GradeLevel)
    private readonly gradeLevelRepo: Repository<GradeLevel>,
    @InjectRepository(SchoolConfigSubject)
    private readonly schoolConfigSubjectRepo: Repository<SchoolConfigSubject>,
    @InjectRepository(CurriculumSubject)
    private readonly curriculumSubjectRepo: Repository<CurriculumSubject>,
    private readonly cacheProvider: CacheProvider,
    private readonly dataSource: DataSource,
  ) {}

  async findTenantById(tenantId: string): Promise<Tenant> {
    const cacheKey = `tenant:${tenantId}`;
    let tenant = await this.cacheProvider.get<Tenant>(cacheKey);

    if (!tenant) {
      tenant = await this.tenantRepo.findOneByOrFail({ id: tenantId });
      await this.cacheProvider.set(cacheKey, tenant, 1800);
    }

    return tenant;
  }

  // async findExistingConfig(tenantId: string): Promise<SchoolConfig | null> {
  //   const cacheKey = this.cacheProvider.generateSchoolConfigKey(tenantId);
  //   let config = await this.cacheProvider.get<SchoolConfig>(cacheKey);

  //   if (config === null) {
  //     config = await this.schoolConfigRepo.findOne({
  //       where: { tenant: { id: tenantId } },
  //       relations: ['configLevels'],
  //     });

  //     if (config) {
  //       await this.cacheProvider.set(cacheKey, config, 3600);
  //     }
  //   }

  //   return config;
  // }

  async findExistingConfig(tenantId: string): Promise<SchoolConfig | null> {
    const cacheKey = this.cacheProvider.generateSchoolConfigKey(tenantId);
    let config = await this.cacheProvider.get<SchoolConfig>(cacheKey);

    if (config === null) {
      config = await this.schoolConfigRepo.findOne({
        where: { tenant: { id: tenantId }, isActive: true },
        relations: [
          'configCurricula',
          'configCurricula.curriculum',
          'schoolType',
        ],
      });

      if (config) {
        // Cache for shorter time during active configuration periods
        const ttl = config.configCurricula?.length > 0 ? 3600 : 300; // 5 min if not configured
        await this.cacheProvider.set(cacheKey, config, ttl);
      }
    }

    return config;
  }

  async findBasicConfigByTenant(
    tenantId: string,
  ): Promise<SchoolConfig | null> {
    const cacheKey = this.cacheProvider.generateSchoolConfigKey(tenantId);
    let config = await this.cacheProvider.get<SchoolConfig>(cacheKey);

    if (!config) {
      config = await this.schoolConfigRepo.findOne({
        where: { tenant: { id: tenantId }, isActive: true },
        relations: ['tenant', 'configLevels', 'configLevels.level'],
      });
      if (config) await this.cacheProvider.set(cacheKey, config, 3600);
    }
    return config;
  }

  async validateTenantExists(tenantId: string): Promise<void> {
    const cacheKey = `tenant:exists:${tenantId}`;
    let exists = await this.cacheProvider.get<boolean>(cacheKey);

    if (exists === null) {
      const tenant = await this.tenantRepo.findOne({
        where: { id: tenantId },
        select: ['id'],
      });
      exists = !!tenant;

     
      await this.cacheProvider.set(cacheKey, exists, 300);
    }

    if (!exists) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }
  }

  async validateLevelsAndSchoolType(levelNames: string[]) {
    console.log('VALIDATING LEVEL NAMES:', levelNames);

    const curricula = await this.curriculumRepo.find({
      where: { display_name: In(levelNames) },
      relations: [
        'schoolType',
        'gradeLevels',
        'gradeLevels.schoolLevel',
        'curriculumSubjects',
        'curriculumSubjects.subject',
      ],
      order: { gradeLevels: { order: 'ASC' } },
    });

    console.log('FOUND CURRICULA FROM DB:', curricula.length);
    console.log(
      'CURRICULA DETAILS:',
      curricula.map((c) => ({
        id: c.id,
        name: c.display_name,
        schoolType: c.schoolType.name,
        schoolTypeId: c.schoolType.id,
      })),
    );

    if (curricula.length !== levelNames.length) {
      const foundNames = curricula.map((c) => c.display_name);
      const missing = levelNames.filter((name) => !foundNames.includes(name));
      throw new BadRequestException(`Levels not found: ${missing.join(', ')}`);
    }

    const distinctTypes = new Set(curricula.map((c) => c.schoolType.id));
    console.log('DISTINCT SCHOOL TYPES:', distinctTypes);

    if (distinctTypes.size !== 1) {
      throw new BadRequestException(
        'All levels must belong to the same school type',
      );
    }

    const schoolType = {
      id: curricula[0].schoolType.id,
      name: curricula[0].schoolType.name,
      code: curricula[0].schoolType.code,
    };

    console.log(
      'RETURNING - Levels count:',
      curricula.length,
      'SchoolType:',
      schoolType,
    );

    return {
      levels: curricula,
      schoolType,
    };
  }

  async findCurriculumSubjects(gradeLevelIds: number[], schoolTypeId: number) {
    const cacheKey = this.cacheProvider.generateCurriculumSubjectsKey(
      gradeLevelIds,
      schoolTypeId,
    );
    let subjects = await this.cacheProvider.get<CurriculumSubject[]>(cacheKey);

    if (!subjects) {
      subjects = await this.curriculumSubjectRepo.find({
        where: {
          gradeLevel: In(gradeLevelIds),
          curriculum: { schoolType: { id: String(schoolTypeId) } },
        },
        relations: ['subject'],
      });

      await this.cacheProvider.set(cacheKey, subjects, 3600); // 1 hour
    }

    return subjects;
  }

  async findCompleteConfig(configId: string): Promise<SchoolConfig | null> {
    const cacheKey = `school_config:complete:${configId}`;
    let config = await this.cacheProvider.get<SchoolConfig>(cacheKey);

    if (!config) {
      config = await this.schoolConfigRepo.findOne({
        where: { id: String(configId) },
        relations: [
          'tenant',
          'schoolType',
          'configLevels',
          'configLevels.level',
          'configLevels.gradeLevels',
          'configLevels.gradeLevels.gradeLevel',
          'configLevels.subjects',
          'configLevels.subjects.subject',
        ],
      });

      if (config) {
        await this.cacheProvider.set(cacheKey, config, 1800);
      }
    }

    return config;
  }

  async invalidateConfigCache(tenantId: string): Promise<void> {
    await this.cacheProvider.invalidateByPattern(`school_config:*${tenantId}*`);
    await this.cacheProvider.invalidateByPattern(`tenant:${tenantId}`);
  }

  async findCompleteConfigByTenant(
    tenantId: string,
  ): Promise<SchoolConfig | null> {
    const cacheKey = `school_config:complete:tenant:${tenantId}`;
    let config = await this.cacheProvider.get<any>(cacheKey);

    if (!config) {
      const raw = await this.dataSource.query(
        `
      SELECT
        sc.id            AS "configId",
        sc."createdAt",
        t.id             AS "tenantId",
        t.name           AS "tenantName",
        t.subdomain      AS "tenantSubdomain",

        c.id             AS "levelId",
        c.name           AS "levelName",
        c.display_name   AS "levelDesc",

        gl.id            AS "gradeId",
        gl.name          AS "gradeName",
        gl.code          AS "gradeCode",
        gl.order         AS "gradeOrder",
        gl.age,

        st.id            AS "streamId",
        st.name          AS "streamName",

        s.id             AS "subjectId",
        s.name           AS "subjectName",
        s.code           AS "subjectCode",
        s.category,
        s.department,
        s."shortName",
        cs."isCompulsory",
        cs."totalMarks",
        cs."passingMarks",
        cs."creditHours",
        cs."subjectType",
        c.name           AS "curriculum"
      FROM school_config sc
      JOIN tenants               t  ON t.id = sc."tenantId"
      JOIN school_config_level   cl ON cl."schoolConfigId" = sc.id
      JOIN curricula             c  ON c.id = cl."levelId"
      LEFT JOIN grade_level      gl ON gl.curriculum_id = c.id
      LEFT JOIN streams          st ON st.grade_level_id = gl.id
                                   AND st.tenant_id = sc.tenant_id   -- <-- TENANT FILTER
      LEFT JOIN curriculum_subjects cs ON cs.curriculum_id = c.id
      LEFT JOIN subjects s ON s.id = cs.subject_id
      WHERE sc.tenant_id = $1
        AND sc.is_active = true
      ORDER BY c.display_name, gl.order, s.name;
      `,
        [tenantId],
      );

      if (!raw?.length) return null;

      const levelMap = new Map<string, any>();

      for (const r of raw) {
        if (!levelMap.has(r.levelId)) {
          levelMap.set(r.levelId, {
            id: r.levelId,
            name: r.levelName,
            description: r.levelDesc,
            subjects: [],
            gradeLevels: [],
          });
        }
        const level = levelMap.get(r.levelId);

        /* Grade */
        if (
          r.gradeId &&
          !level.gradeLevels.find((g: any) => g.id === r.gradeId)
        ) {
          level.gradeLevels.push({
            id: r.gradeId,
            name: r.gradeName,
            code: r.gradeCode,
            order: r.gradeOrder,
            age: r.age,
            streams: [],
          });
        }

        /* Stream */
        const grade = level.gradeLevels.find((g: any) => g.id === r.gradeId);
        if (
          grade &&
          r.streamId &&
          !grade.streams.find((s: any) => s.id === r.streamId)
        ) {
          grade.streams.push({ id: r.streamId, name: r.streamName });
        }

        /* Subject */
        if (
          r.subjectId &&
          !level.subjects.find((s: any) => s.id === r.subjectId)
        ) {
          level.subjects.push({
            id: r.subjectId,
            name: r.subjectName,
            code: r.subjectCode,
            subjectType: r.subjectType,
            category: r.category,
            department: r.department,
            shortName: r.shortName,
            isCompulsory: r.isCompulsory,
            totalMarks: r.totalMarks,
            passingMarks: r.passingMarks,
            creditHours: r.creditHours,
            curriculum: r.curriculum,
          });
        }
      }

      config = {
        id: raw[0].configId,
        createdAt: raw[0].createdAt,
        tenant: {
          id: raw[0].tenantId,
          name: raw[0].tenantName,
          subdomain: raw[0].tenantSubdomain,
        },
        configLevels: Array.from(levelMap.values()).map((l) => ({
          level: l,
        })),
      };

      await this.cacheProvider.set(cacheKey, config, 1800);
    } else {
      this.logger.debug(`Cache hit for complete config tenant: ${tenantId}`);
    }

    return config;
  }
}

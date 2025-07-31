import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchoolConfig } from '../school-type/entities/school-config.entity';
import { SchoolConfigLevel } from '../school-type/entities/school_config_level';
import { SchoolConfigGradeLevel } from '../school-type/entities/school_config_grade_level';

@Injectable()
export class SchoolSetupGuardService {
  constructor(
    @InjectRepository(SchoolConfig)
    private readonly schoolConfigRepo: Repository<SchoolConfig>,
    @InjectRepository(SchoolConfigLevel)
    private readonly configLevelRepo: Repository<SchoolConfigLevel>,
    @InjectRepository(SchoolConfigGradeLevel)
    private readonly configGradeRepo: Repository<SchoolConfigGradeLevel>,
  ) {}

  /**
   * Validates if the school setup is complete (i.e., at least one level and grade has been selected).
   */
  async validateSchoolIsConfigured(tenantId: string) {
    const config = await this.schoolConfigRepo.findOne({
      where: { tenant: { id: tenantId } },
    });

    if (!config) {
      throw new BadRequestException('School setup not found for tenant.');
    }

    const levels = await this.configLevelRepo.find({
      where: { schoolConfig: { id: config.id } },
      relations: ['gradeLevels'],
    });

    const hasAtLeastOneGrade = levels.some(
      (level) => level.gradeLevels && level.gradeLevels.length > 0,
    );

    if (!hasAtLeastOneGrade) {
      throw new BadRequestException(
        'Please complete your school setup before performing this action.',
      );
    }
  }

  /**
   * Checks if the given grade level belongs to the tenant's configured school setup.
   */
  async validateGradeLevelBelongsToTenant(
    tenantId: string,
    gradeLevelId: string,
  ): Promise<boolean> {
    const config = await this.schoolConfigRepo.findOne({
      where: { tenant: { id: tenantId } },
    });

    if (!config) return false;

    const levelConfigs = await this.configLevelRepo.find({
      where: { schoolConfig: { id: config.id } },
      relations: ['gradeLevels', 'gradeLevels.gradeLevel'],
    });

    const gradeIds = levelConfigs
      .flatMap((l) => l.gradeLevels)
      .map((g) => g.gradeLevel?.id);

    return gradeIds.includes(gradeLevelId);
  }
}

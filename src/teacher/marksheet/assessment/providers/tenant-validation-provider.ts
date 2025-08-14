// src/assessment/providers/tenant-validation-provider.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';
import { TenantSubject } from 'src/admin/school-type/entities/tenant-specific-subject';

@Injectable()
export class TenantValidationServiceProvider {
  constructor(
    @InjectRepository(TenantGradeLevel)
    private readonly tglRepo: Repository<TenantGradeLevel>,
    @InjectRepository(TenantSubject)
    private readonly tsRepo: Repository<TenantSubject>,
  ) {}

  async validateGradeLevelOwnership(
    tenantGradeLevelId: string,
    tenantId: string,
  ): Promise<void> {
    const exists = await this.tglRepo
      .createQueryBuilder('tgl')
      .where('tgl.id = :id', { id: tenantGradeLevelId })
      .andWhere('tgl.tenantId = :tenantId', { tenantId })
      .getExists();

    if (!exists) {
      throw new BadRequestException(
        `Grade level ${tenantGradeLevelId} does not belong to tenant ${tenantId}.`,
      );
    }
  }

  async validateSubjectOwnership(
    tenantSubjectId: string,
    tenantId: string,
  ): Promise<void> {
    const count = await this.tsRepo.count({
      where: { id: tenantSubjectId, tenant: { id: tenantId } },
      take: 1, // stops after 1 match
    });

    if (count === 0) {
      throw new BadRequestException(
        `Subject ${tenantSubjectId} does not belong to tenant ${tenantId}.`,
      );
    }
  }
}

  // async validateSubjectOwnership(
  //   subjectId: string,
  //   gradeLevelId: string,
  //   tenantId: string,
  // ) {
  //   const config = await this.schoolConfigRepo.findOne({
  //     where: { tenant: { id: tenantId } },
  //     relations: [
  //       'selectedLevels',
  //       'selectedLevels.subjects',
  //       'selectedLevels.gradeLevels',
  //     ],
  //   });

  //   if (!config) {
  //     throw new ForbiddenException('School not configured');
  //   }

  //   // Check if any level has both the subject and grade level
  //   const validLevel = config.selectedLevels?.find((level) => {
  //     const subjectMatch = level.subjects?.some((subj) => subj.id === subjectId);
  //     const gradeMatch = level.gradeLevels?.some(
  //       (grade) => grade.id === gradeLevelId,
  //     );
  //     return subjectMatch && gradeMatch;
  //   });

  //   if (!validLevel) {
  //     throw new ForbiddenException(
  //       'Subject not available for this grade level',
  //     );
  //   }
  // }

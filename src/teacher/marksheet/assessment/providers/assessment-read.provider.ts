import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssessmentFilterInput } from '../dto/assessment-filter.input';
import { AssessType } from '../enums/assesment-type.enum';
import { Assessment } from '../entity/assessment.entity';
import { SchoolSetupGuardService } from 'src/admin/config/school-config.guard';

@Injectable()
export class AssessmentReadProvider {
  constructor(
    @InjectRepository(Assessment)
    private readonly repo: Repository<Assessment>,
    private readonly schoolSetupGuardService: SchoolSetupGuardService,
  ) {}

  private async ensureSchoolConfigured(tenantId: string): Promise<void> {
    await this.schoolSetupGuardService.validateSchoolIsConfigured(tenantId);
  }

  async getAll(
    tenantId: string,
    filter?: AssessmentFilterInput,
  ): Promise<Assessment[]> {
    await this.ensureSchoolConfigured(tenantId);

    const qb = this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.tenantGradeLevel', 'tgl')
      .leftJoinAndSelect('tgl.gradeLevel', 'gl')
      .leftJoinAndSelect('a.tenantSubject', 'ts')
      .leftJoinAndSelect('ts.subject', 's')
      .where('a.tenantId = :tenantId', { tenantId });

    /* existing filters … */
    if (filter?.type) qb.andWhere('a.type = :type', { type: filter.type });
    if (filter?.tenantGradeLevelId)
      qb.andWhere('a.tenantGradeLevelId = :tenantGradeLevelId', {
        tenantGradeLevelId: filter.tenantGradeLevelId,
      });
    if (filter?.tenantSubjectId)
      qb.andWhere('a.tenantSubjectId = :tenantSubjectId', {
        tenantSubjectId: filter.tenantSubjectId,
      });
    if (filter?.term !== undefined)
      qb.andWhere('a.term = :term', { term: filter.term });
    if (filter?.academicYear)
      qb.andWhere('a.academicYear = :academicYear', {
        academicYear: filter.academicYear,
      });

    return qb.orderBy('a.createdAt', 'DESC').getMany();
  }

  async deleteAssessment(
    id: string,
    tenantId: string,
    allowedType: AssessType,
  ): Promise<boolean> {
    await this.ensureSchoolConfigured(tenantId);

    const res = await this.repo.delete({
      id,
      tenantId,
      type: allowedType,
    });
    return res.affected === 1;
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssessmentFilterInput } from '../dto/assessment-filter.input';
import { AssessType } from '../enums/assesment-type.enum';
import { Assessment } from '../entity/assessment.entity';

@Injectable()
export class AssessmentReadProvider {
  constructor(
    @InjectRepository(Assessment)
    private readonly repo: Repository<Assessment>,
  ) {}

  async getAll(
    tenantId: string,
    filter?: AssessmentFilterInput,
  ): Promise<Assessment[]> {
    const qb = this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.tenantGradeLevel', 'tgl')
      .leftJoinAndSelect('tgl.gradeLevel', 'gl')
      .leftJoinAndSelect('a.tenantSubject', 'ts')
      .leftJoinAndSelect('ts.subject', 's')
      .where('a.tenantId = :tenantId', { tenantId });

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

    return qb.orderBy('a.createdAt', 'DESC').getMany();
  }

  async deleteAssessment(
    id: string,
    tenantId: string,
    allowedType: AssessType,
  ): Promise<boolean> {
    const res = await this.repo.delete({
      id,
      tenantId,
      type: allowedType,
    });
    return res.affected === 1;
  }
}

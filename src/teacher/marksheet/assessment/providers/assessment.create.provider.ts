// src/assessment/providers/assessment-create.provider.ts
import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateAssessmentInput } from '../dto/create-assessment.input';

import { AssessmentCacheProvider } from './assessment-cache.provider';
import { TenantValidationServiceProvider } from './tenant-validation-provider';
import { AssessType } from '../enums/assesment-type.enum';
import { Assessment } from '../entity/assessment.entity';
import { SchoolSetupGuardService } from 'src/admin/config/school-config.guard';

@Injectable()
export class AssessmentCreateProvider {
  constructor(
    @InjectRepository(Assessment)
    private readonly assessmentRepo: Repository<Assessment>,
    private readonly cacheProvider: AssessmentCacheProvider,
    private readonly tenantValidator: TenantValidationServiceProvider,
    private readonly dataSource: DataSource,
    private readonly schoolSetupGuardService: SchoolSetupGuardService,
  ) {}

  async createAssessment(
    input: CreateAssessmentInput,
    tenantId: string,
  ): Promise<Assessment> {
    if (!tenantId) throw new BadRequestException('Tenant ID is required');

    await this.schoolSetupGuardService.validateSchoolIsConfigured(tenantId);

    await this.tenantValidator.validateGradeLevelOwnership(
      input.tenantGradeLevelId,
      tenantId,
    );
    await this.tenantValidator.validateSubjectOwnership(
      input.tenantSubjectId,
      tenantId,
    );

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Assessment);

      if (input.type === AssessType.CA) {
        return this.createCA(input, tenantId, repo);
      }

      if (input.type === AssessType.EXAM) {
        return this.createExam(input, tenantId, repo);
      }

      throw new BadRequestException('Invalid assessment type');
    });
  }

  private async createCA(
    input: CreateAssessmentInput,
    tenantId: string,
    repo: Repository<Assessment>,
  ): Promise<Assessment> {
    const nextNumber = await this.cacheProvider.getNextCANumber(
      tenantId,
      input.tenantSubjectId,
      input.tenantGradeLevelId,
      input.term.toString(),
    );

    const existingCAs = await repo.find({
      where: {
        tenantId,
        tenantSubjectId: input.tenantSubjectId,
        tenantGradeLevelId: input.tenantGradeLevelId,
        type: AssessType.CA,
        term: input.term,
      },
      order: { title: 'ASC' },
    });

    const caNumbers = existingCAs
      .map((a) => a.title)
      .filter((t) => t.startsWith('CA'))
      .map((t) => parseInt(t.replace('CA ', ''), 10))
      .filter((n) => !isNaN(n));

    const dbNextNumber = caNumbers.length ? Math.max(...caNumbers) + 1 : 1;
    const finalNumber = Math.max(nextNumber, dbNextNumber);

    const assessment = repo.create({
      ...input,
      title: `CA ${finalNumber}`,
      tenantId,
    });

    const saved = await repo.save(assessment);
    await this.cacheProvider.cacheAssessment(saved);
    return saved;
  }

  private async createExam(
    input: CreateAssessmentInput,
    tenantId: string,
    repo: Repository<Assessment>,
  ): Promise<Assessment> {
    const lockKey = `exam-lock:${tenantId}:${input.tenantSubjectId}:${input.tenantGradeLevelId}:${input.term}`;
    const lockAcquired = await this.cacheProvider.acquireLock(lockKey, '1', 30);

    if (!lockAcquired) {
      throw new ConflictException(
        'Exam creation is in progress, please try again later',
      );
    }

    try {
      const nextNumber = await this.cacheProvider.getNextExamNumber(
        tenantId,
        input.tenantSubjectId,
        input.tenantGradeLevelId,
        input.term.toString(),
      );

      const existingExams = await repo.find({
        where: {
          tenantId,
          tenantSubjectId: input.tenantSubjectId,
          tenantGradeLevelId: input.tenantGradeLevelId,
          type: AssessType.EXAM,
          term: input.term,
        },
        order: { title: 'ASC' },
      });

      const examNumbers = existingExams
        .map((a) => a.title)
        .filter((t) => t.startsWith('Exam'))
        .map((t) => parseInt(t.replace('Exam ', ''), 10))
        .filter((n) => !isNaN(n));

      const dbNextNumber = examNumbers.length
        ? Math.max(...examNumbers) + 1
        : 1;
      const finalNumber = Math.max(nextNumber, dbNextNumber);

      const assessment = repo.create({
        ...input,
        title: `Exam ${finalNumber}`,
        tenantId,
      });

      const saved = await repo.save(assessment);
      await this.cacheProvider.cacheAssessment(saved);
      return saved;
    } finally {
      await this.cacheProvider.releaseLock(lockKey, '1');
    }
  }


}

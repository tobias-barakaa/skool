import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateAssessmentInput } from '../dto/create-assessment.input';
import {
  Assessment,
  AssessmentStatus,
  AssessmentType,
} from '../entity/assessment.entity';
import { AssessmentCacheProvider } from './assessment-cache.provider';
import { TenantValidationServiceProvider } from './tenant-validation-provider';

@Injectable()
export class AssessmentCreateProvider {
  constructor(
    @InjectRepository(Assessment)
    private assessmentRepo: Repository<Assessment>,
    private readonly cacheProvider: AssessmentCacheProvider,
    private readonly tenantValidator: TenantValidationServiceProvider,

    private readonly dataSource: DataSource,
  ) {}

  async createAssessment(
    input: CreateAssessmentInput,
    tenantId: string,
  ): Promise<Assessment> {
    // Validate input

    await this.tenantValidator.validateGradeLevelOwnership(
      input.gradeLevelId,
      tenantId,
    );

    // await this.tenantValidator.validateSubjectOwnership(
    //   input.subjectId,
    //   input.gradeLevelId,
    //   tenantId,
    // );

    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }

    return this.dataSource.transaction(async (manager) => {
      const assessmentRepo = manager.getRepository(Assessment);

      if (input.type === AssessmentType.CA) {
        return this.createCA(input, tenantId, assessmentRepo);
      }

      if (input.type === AssessmentType.EXAM) {
        return this.createExam(input, tenantId, assessmentRepo);
      }

      throw new BadRequestException('Invalid assessment type');
    });
  }

  private async createCA(
    input: CreateAssessmentInput,
    tenantId: string,
    assessmentRepo: Repository<Assessment>,
  ): Promise<Assessment> {
    // Get next CA number from Redis
    const nextNumber = await this.cacheProvider.getNextCANumber(
      tenantId,
      input.subjectId,
      input.gradeLevelId,
      input.term,
    );

    // Double-check with database to ensure consistency
    const existingCAs = await assessmentRepo.find({
      where: {
        subjectId: input.subjectId,
        gradeLevelId: input.gradeLevelId,
        type: AssessmentType.CA,
        tenantId,
        term: input.term,
      },
      order: { title: 'ASC' },
    });

    const caNumbers = existingCAs
      .map((a) => a.title)
      .filter((t) => t.startsWith('CA'))
      .map((t) => parseInt(t.replace('CA ', ''), 10))
      .filter((n) => !isNaN(n));

    const dbNextNumber = caNumbers.length > 0 ? Math.max(...caNumbers) + 1 : 1;
    const finalNumber = Math.max(nextNumber, dbNextNumber);

    const assessment = assessmentRepo.create({
      ...input,
      title: `CA ${finalNumber}`,
      type: input.type as AssessmentType,
      status: input.status as AssessmentStatus,
      tenantId,
    });

    const savedAssessment = await assessmentRepo.save(assessment);

    // Cache the new assessment
    await this.cacheProvider.cacheAssessment(savedAssessment);

    return savedAssessment;
  }

  private async createExam(
    input: CreateAssessmentInput,
    tenantId: string,
    assessmentRepo: Repository<Assessment>,
  ): Promise<Assessment> {
    // Try to acquire lock for exam creation
    const lockAcquired = await this.cacheProvider.acquireExamLock(
      tenantId,
      input.subjectId,
      input.gradeLevelId,
      input.term,
    );

    if (!lockAcquired) {
      throw new ConflictException(
        'Exam creation is in progress, please try again later',
      );
    }

    try {
      // Check if exam already exists
      const existingExam = await assessmentRepo.findOne({
        where: {
          subjectId: input.subjectId,
          gradeLevelId: input.gradeLevelId,
          type: AssessmentType.EXAM,
          tenantId,
          term: input.term,
        },
      });

      if (existingExam) {
        return existingExam;
      }

      const assessment = assessmentRepo.create({
        ...input,
        title: input.title || 'Examination',
        type: input.type as AssessmentType,
        status: input.status as AssessmentStatus,
        tenantId,
      });

      const savedAssessment = await assessmentRepo.save(assessment);

      // Cache the new assessment
      await this.cacheProvider.cacheAssessment(savedAssessment);

      return savedAssessment;
    } finally {
      // Always release the lock
      await this.cacheProvider.releaseExamLock(
        tenantId,
        input.subjectId,
        input.gradeLevelId,
        input.term,
      );
    }
  }
}

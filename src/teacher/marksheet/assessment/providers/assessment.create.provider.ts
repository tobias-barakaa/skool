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

@Injectable()
export class AssessmentCreateProvider {
  constructor(
    @InjectRepository(Assessment)
    private readonly assessmentRepo: Repository<Assessment>,
    private readonly cacheProvider: AssessmentCacheProvider,
    private readonly tenantValidator: TenantValidationServiceProvider,
    private readonly dataSource: DataSource,
  ) {}

  async createAssessment(
    input: CreateAssessmentInput,
    tenantId: string,
  ): Promise<Assessment> {
    if (!tenantId) throw new BadRequestException('Tenant ID is required');

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
      input.term.toString(), // Convert to string for cache key
    );

    const existingCAs = await repo.find({
      where: {
        tenantId,
        tenantSubjectId: input.tenantSubjectId,
        tenantGradeLevelId: input.tenantGradeLevelId,
        type: AssessType.CA,
        term: input.term, // Keep as number for database query
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
      // term is already a number from input, so no conversion needed
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
      const existing = await repo.findOne({
        where: {
          tenantId,
          tenantSubjectId: input.tenantSubjectId,
          tenantGradeLevelId: input.tenantGradeLevelId,
          type: AssessType.EXAM,
          term: input.term, // Keep as number for database query
        },
      });

      if (existing) return existing;

      const assessment = repo.create({
        ...input,
        title: input.title || 'Examination',
        tenantId,
        // term is already a number from input, so no conversion needed
      });

      const saved = await repo.save(assessment);
      await this.cacheProvider.cacheAssessment(saved);
      return saved;
    } finally {
      await this.cacheProvider.releaseLock(lockKey, '1');
    }
  }
}
// import {
//   Injectable,
//   ConflictException,
//   BadRequestException,
// } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository, DataSource } from 'typeorm';
// import { CreateAssessmentInput } from '../dto/create-assessment.input';
// import {
//   Assessment,
//   AssessmentStatus,
//   AssessmentType,
// } from '../entity/assessment.entity';
// import { AssessmentCacheProvider } from './assessment-cache.provider';
// import { TenantValidationServiceProvider } from './tenant-validation-provider';

// @Injectable()
// export class AssessmentCreateProvider {
//   constructor(
//     @InjectRepository(Assessment)
//     private readonly assessmentRepo: Repository<Assessment>,
//     private readonly cacheProvider: AssessmentCacheProvider,
//     private readonly tenantValidator: TenantValidationServiceProvider,
//     private readonly dataSource: DataSource,
//   ) {}

//   async createAssessment(
//     input: CreateAssessmentInput,
//     tenantId: string,
//   ): Promise<Assessment> {
//     if (!tenantId) throw new BadRequestException('Tenant ID is required');

//     await this.tenantValidator.validateGradeLevelOwnership(
//       input.tenantGradeLevelId,
//       tenantId,
//     );
//     await this.tenantValidator.validateSubjectOwnership(
//       input.tenantSubjectId,
//       tenantId,
//     );

//     return this.dataSource.transaction(async (manager) => {
//       const repo = manager.getRepository(Assessment);

//       if (input.type === AssessmentType.CA) {
//         return this.createCA(input, tenantId, repo);
//       }

//       if (input.type === AssessmentType.EXAM) {
//         return this.createExam(input, tenantId, repo);
//       }

//       throw new BadRequestException('Invalid assessment type');
//     });
//   }

//   /* ---------- helpers ---------- */

//   private async createCA(
//     input: CreateAssessmentInput,
//     tenantId: string,
//     repo: Repository<Assessment>,
//   ): Promise<Assessment> {
//     const nextNumber = await this.cacheProvider.getNextCANumber(
//       tenantId,
//       input.tenantSubjectId,
//       input.tenantGradeLevelId,
//       input.term,
//     );

//     const existingCAs = await repo.find({
//       where: {
//         tenantId,
//         tenantSubjectId: input.tenantSubjectId,
//         tenantGradeLevelId: input.tenantGradeLevelId,
//         type: AssessmentType.CA,
//         term: input.term,
//       },
//       order: { title: 'ASC' },
//     });

//     const caNumbers = existingCAs
//       .map((a) => a.title)
//       .filter((t) => t.startsWith('CA'))
//       .map((t) => parseInt(t.replace('CA ', ''), 10))
//       .filter((n) => !isNaN(n));

//     const dbNextNumber = caNumbers.length ? Math.max(...caNumbers) + 1 : 1;
//     const finalNumber = Math.max(nextNumber, dbNextNumber);

//     const assessment = repo.create({
//       ...input,
//       title: `CA ${finalNumber}`,
//       tenantId,
//     });

//     const saved = await repo.save(assessment);
//     await this.cacheProvider.cacheAssessment(saved);
//     return saved;
//   }

//   private async createExam(
//     input: CreateAssessmentInput,
//     tenantId: string,
//     repo: Repository<Assessment>,
//   ): Promise<Assessment> {
//     const lockKey = `exam-lock:${tenantId}:${input.tenantSubjectId}:${input.tenantGradeLevelId}:${input.term}`;
//     const lockAcquired = await this.cacheProvider.acquireLock(lockKey, '1', 30);

//     if (!lockAcquired) {
//       throw new ConflictException(
//         'Exam creation is in progress, please try again later',
//       );
//     }

//     try {
//       const existing = await repo.findOne({
//         where: {
//           tenantId,
//           tenantSubjectId: input.tenantSubjectId,
//           tenantGradeLevelId: input.tenantGradeLevelId,
//           type: AssessmentType.EXAM,
//           term: input.term,
//         },
//       });

//       if (existing) return existing;

//       const assessment = repo.create({
//         ...input,
//         title: input.title || 'Examination',
//         tenantId,
//       });

//       const saved = await repo.save(assessment);
//       await this.cacheProvider.cacheAssessment(saved);
//       return saved;
//     } finally {
//       await this.cacheProvider.releaseLock(lockKey, '1');
//     }
//   }
// }
// import {
//   Injectable,
//   ConflictException,
//   BadRequestException,
// } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository, DataSource } from 'typeorm';
// import { CreateAssessmentInput } from '../dto/create-assessment.input';
// import {
//   Assessment,
//   AssessmentStatus,
//   AssessmentType,
// } from '../entity/assessment.entity';
// import { AssessmentCacheProvider } from './assessment-cache.provider';
// import { TenantValidationServiceProvider } from './tenant-validation-provider';

// @Injectable()
// export class AssessmentCreateProvider {
//   constructor(
//     @InjectRepository(Assessment)
//     private assessmentRepo: Repository<Assessment>,
//     private readonly cacheProvider: AssessmentCacheProvider,
//     private readonly tenantValidator: TenantValidationServiceProvider,

//     private readonly dataSource: DataSource,
//   ) {}

//   async createAssessment(
//     input: CreateAssessmentInput,
//     tenantId: string,
//   ): Promise<Assessment> {
//     // Validate input

//     await this.tenantValidator.validateGradeLevelOwnership(
//       input.gradeLevelId,
//       tenantId,
//     );

//     if (!tenantId) {
//       throw new BadRequestException('Tenant ID is required');
//     }

//     return this.dataSource.transaction(async (manager) => {
//       const assessmentRepo = manager.getRepository(Assessment);

//       if (input.type === AssessmentType.CA) {
//         return this.createCA(input, tenantId, assessmentRepo);
//       }

//       if (input.type === AssessmentType.EXAM) {
//         return this.createExam(input, tenantId, assessmentRepo);
//       }

//       throw new BadRequestException('Invalid assessment type');
//     });
//   }

//   private async createCA(
//     input: CreateAssessmentInput,
//     tenantId: string,
//     assessmentRepo: Repository<Assessment>,
//   ): Promise<Assessment> {
//     // Get next CA number from Redis
//     const nextNumber = await this.cacheProvider.getNextCANumber(
//       tenantId,
//       input.subjectId,
//       input.gradeLevelId,
//       input.term,
//     );

//     // Double-check with database to ensure consistency
//     const existingCAs = await assessmentRepo.find({
//       where: {
//         subjectId: input.subjectId,
//         gradeLevelId: input.gradeLevelId,
//         type: AssessmentType.CA,
//         tenantId,
//         term: input.term,
//       },
//       order: { title: 'ASC' },
//     });

//     const caNumbers = existingCAs
//       .map((a) => a.title)
//       .filter((t) => t.startsWith('CA'))
//       .map((t) => parseInt(t.replace('CA ', ''), 10))
//       .filter((n) => !isNaN(n));

//     const dbNextNumber = caNumbers.length > 0 ? Math.max(...caNumbers) + 1 : 1;
//     const finalNumber = Math.max(nextNumber, dbNextNumber);

//     const assessment = assessmentRepo.create({
//       ...input,
//       title: `CA ${finalNumber}`,
//       type: input.type as AssessmentType,
//       status: input.status as AssessmentStatus,
//       tenantId,
//     });

//     const savedAssessment = await assessmentRepo.save(assessment);

//     // Cache the new assessment
//     await this.cacheProvider.cacheAssessment(savedAssessment);

//     return savedAssessment;
//   }

//   private async createExam(
//     input: CreateAssessmentInput,
//     tenantId: string,
//     assessmentRepo: Repository<Assessment>,
//   ): Promise<Assessment> {
//     // Try to acquire lock for exam creation
//     const lockAcquired = await this.cacheProvider.acquireExamLock(
//       tenantId,
//       input.subjectId,
//       input.gradeLevelId,
//       input.term,
//     );

//     if (!lockAcquired) {
//       throw new ConflictException(
//         'Exam creation is in progress, please try again later',
//       );
//     }

//     try {
//       // Check if exam already exists
//       const existingExam = await assessmentRepo.findOne({
//         where: {
//           subjectId: input.subjectId,
//           gradeLevelId: input.gradeLevelId,
//           type: AssessmentType.EXAM,
//           tenantId,
//           term: input.term,
//         },
//       });

//       if (existingExam) {
//         return existingExam;
//       }

//       const assessment = assessmentRepo.create({
//         ...input,
//         title: input.title || 'Examination',
//         type: input.type as AssessmentType,
//         status: input.status as AssessmentStatus,
//         tenantId,
//       });

//       const savedAssessment = await assessmentRepo.save(assessment);

//       // Cache the new assessment
//       await this.cacheProvider.cacheAssessment(savedAssessment);

//       return savedAssessment;
//     } finally {
//       await this.cacheProvider.releaseExamLock(
//         tenantId,
//         input.subjectId,
//         input.gradeLevelId,
//         input.term,
//       );
//     }
//   }
// }

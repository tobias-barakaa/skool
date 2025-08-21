// import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import Redis from 'ioredis';
// import { DEFAULT_SCALE_CONFIGS, ScaleTier } from 'src/admin/tenants/dtos/scale-dto';
// import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
// import { DataSource, Repository } from 'typeorm';
// import { TenantScaleInfo, UpdateTenantScaleInput } from '../dtos/test-dto';
// import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
// import { SchoolSetupGuardService } from 'src/admin/config/school-config.guard';
// import { TenantScaleService } from './tenant-scale.service';

// @Injectable()
// export class TransparentScalingTestService {
//   constructor(
//     private readonly dataSource: DataSource,
//     private readonly schoolSetupGuardService: SchoolSetupGuardService,
//     private readonly tenantScaleService: TenantScaleService,
//     private readonly rateLimitService: RateLimitService,
//     private readonly idempotencyService: IdempotencyService,
//     @InjectQueue('test-creation') private readonly creationQueue: Queue<TestCreationJob>,
//     @InjectQueue('test-processing') private readonly processingQueue: Queue<TestProcessingJob>,
//     @Inject('REDIS_CLIENT') private readonly redis: Redis,
//   ) {}

//   // Main method - looks identical to your original but scales automatically
//   async createTest(
//     dto: CreateTestInput, // Your ORIGINAL DTO - unchanged!
//     teacher: ActiveUserData,
//   ): Promise<Test> {
//     // 1. Get tenant's current scale configuration (transparent to user)
//     const scaleConfig = await this.tenantScaleService.getTenantScaleConfig(teacher.tenantId);

//     // 2. Auto-generate idempotency key for requests
//     const idempotencyKey = this.generateIdempotencyKey(dto, teacher);

//     await this.schoolSetupGuardService.validateSchoolIsConfigured(teacher.tenantId);

//     // 3. Apply rate limiting based on tenant's scale
//     const canProceed = await this.rateLimitService.checkRateLimit(
//       teacher.tenantId,
//       teacher.sub,
//       scaleConfig
//     );

//     if (!canProceed) {
//       throw new BadRequestException('System temporarily busy. Please try again in a moment.');
//     }

//     // 4. Check idempotency
//     const idempotencyCheck = await this.idempotencyService.checkIdempotency(
//       teacher.tenantId,
//       idempotencyKey
//     );

//     if (idempotencyCheck.isProcessing) {
//       // Return a "processing" response for duplicate requests
//       return this.createProcessingResponse(dto, teacher);
//     }

//     if (idempotencyCheck.result) {
//       return idempotencyCheck.result;
//     }

//     try {
//       // 5. Create core test record (always fast)
//       const test = await this.createCoreTest(dto, teacher, idempotencyKey);

//       // 6. Handle additional processing based on tenant's scale config
//       if (this.shouldUseAsyncProcessing(dto, scaleConfig)) {
//         // High-scale tenants: async processing
//         await this.enqueueAsyncProcessing(test, dto, teacher, scaleConfig);
//         test.processingStatus = 'processing';

//         // For async processing, return immediately
//         await this.idempotencyService.storeResult(teacher.tenantId, idempotencyKey, test);
//         return test;
//       } else {
//         // Low-scale tenants: synchronous processing (like your original code)
//         await this.processSynchronously(test, dto, teacher);
//         test.processingStatus = 'completed';

//         await this.idempotencyService.storeResult(teacher.tenantId, idempotencyKey, test);
//         return test;
//       }

//     } catch (error) {
//       // Clean up on error
//       await this.idempotencyService.clearProcessing(teacher.tenantId, idempotencyKey);
//       throw error;
//     }
//   }
// private generateIdempotencyKey(dto: CreateTestInput, teacher: ActiveUserData): string {
//     // Generate a stable key based on request content
//     const contentHash = crypto
//       .createHash('md5')
//       .update(JSON.stringify({
//         title: dto.title,
//         date: dto.date,
//         tenantSubjectId: dto.tenantSubjectId,
//         tenantGradeLevelIds: dto.tenantGradeLevelIds.sort(),
//         teacherId: teacher.sub,
//       }))
//       .digest('hex');

//     return `test_${teacher.tenantId}_${teacher.sub}_${contentHash}`;
//   }

//   private createProcessingResponse(dto: CreateTestInput, teacher: ActiveUserData): Test {
//     // Create a temporary response for duplicate processing requests
//     return {
//       id: 'processing',
//       title: dto.title,
//       processingStatus: 'processing',
//       createdAt: new Date(),
//       // ... other minimal fields
//     } as Test;
//   }

//   private shouldUseAsyncProcessing(dto: CreateTestInput, config: ScaleConfig): boolean {
//     const questionCount = dto.questions?.length || 0;
//     const materialCount = dto.referenceMaterials?.length || 0;

//     return config.asyncProcessing ||
//            questionCount > config.maxQuestionsInMemory ||
//            materialCount > 10;
//   }

//   private async createCoreTest(
//     dto: CreateTestInput,
//     teacher: ActiveUserData,
//     idempotencyKey: string
//   ): Promise<Test> {
//     const qr = this.dataSource.createQueryRunner();
//     await qr.connect();
//     await qr.startTransaction();

//     try {
//       // Your exact existing validation logic (with caching for performance)
//       const teacherUser = await this.getCachedTeacher(teacher.sub, qr);
//       const tenantGradeLevels = await this.validateGradeLevels(dto, teacher.tenantId, qr);
//       const tenantSubject = await this.validateSubject(dto, teacher.tenantId, qr);

//       // Create test record (same as your original + idempotency fields)
//       const test = qr.manager.create(Test, {
//         title: dto.title,
//         subject: tenantSubject,
//         gradeLevels: tenantGradeLevels,
//         date: new Date(dto.date),
//         startTime: dto.startTime,
//         endTime: dto.endTime,
//         duration: dto.duration,
//         totalMarks: dto.totalMarks,
//         resourceUrl: dto.resourceUrl,
//         instructions: dto.instructions,
//         teacher: teacherUser,
//         idempotencyKey: idempotencyKey,
//         processingStatus: 'pending',
//       });

//       const savedTest = await qr.manager.save(Test, test);
//       await qr.commitTransaction();

//       return savedTest;
//     } catch (error) {
//       await qr.rollbackTransaction();
//       throw error;
//     } finally {
//       await qr.release();
//     }
//   }

//   private async processSynchronously(
//     test: Test,
//     dto: CreateTestInput,
//     teacher: ActiveUserData
//   ): Promise<void> {
//     // Your EXACT existing synchronous processing logic
//     const qr = this.dataSource.createQueryRunner();
//     await qr.connect();
//     await qr.startTransaction();

//     try {
//       if (dto.questions?.length) {
//         for (const qInput of dto.questions) {
//           const question = qr.manager.create(Question, {
//             ...qInput,
//             test: test,
//           });
//           const savedQuestion = await qr.manager.save(Question, question);

//           if (qInput.options?.length) {
//             const options = qInput.options.map(oInput =>
//               qr.manager.create(Option, {
//                 ...oInput,
//                 question: savedQuestion,
//               })
//             );
//             await qr.manager.save(Option, options);
//           }
//         }
//       }

//       if (dto.referenceMaterials?.length) {
//         const materials = dto.referenceMaterials.map(rmInput =>
//           qr.manager.create(ReferenceMaterial, {
//             ...rmInput,
//             test: test,
//           })
//         );
//         await qr.manager.save(ReferenceMaterial, materials);
//       }

//       await qr.commitTransaction();
//     } catch (error) {
//       await qr.rollbackTransaction();
//       throw error;
//     } finally {
//       await qr.release();
//     }
//   }

//   private async enqueueAsyncProcessing(
//     test: Test,
//     dto: CreateTestInput,
//     teacher: ActiveUserData,
//     config: ScaleConfig
//   ): Promise<void> {
//     // Split processing into background jobs for high-scale tenants
//     if (dto.questions?.length) {
//       const batches = this.chunkArray(dto.questions, config.batchSize);

//       for (const [index, batch] of batches.entries()) {
//         await this.creationQueue.add(
//           'process-questions-batch',
//           {
//             testId: test.id,
//             tenantId: teacher.tenantId,
//             teacherId: teacher.sub,
//             questions: batch,
//             referenceMaterials: [],
//             batchIndex: index,
//             totalBatches: batches.length,
//           },
//           {
//             delay: index * config.processingDelay,
//             attempts: 3,
//             backoff: { type: 'exponential', delay: 2000 },
//           }
//         );
//       }
//     }

//     if (dto.referenceMaterials?.length) {
//       await this.creationQueue.add(
//         'process-materials',
//         {
//           testId: test.id,
//           tenantId: teacher.tenantId,
//           teacherId: teacher.sub,
//           questions: [],
//           referenceMaterials: dto.referenceMaterials,
//         },
//         {
//           delay: config.processingDelay,
//           attempts: 3,
//         }
//       );
//     }

//     // Finalization job
//     await this.processingQueue.add(
//       'finalize-test',
//       {
//         testId: test.id,
//         tenantId: teacher.tenantId,
//         operations: ['notifications', 'indexing', 'cache_invalidation'],
//       },
//       {
//         delay: 10000, // Wait for other jobs
//       }
//     );
//   }

//   // Utility methods (same as before)
//   private chunkArray<T>(array: T[], chunkSize: number): T[][] {
//     const chunks: T[][] = [];
//     for (let i = 0; i < array.length; i += chunkSize) {
//       chunks.push(array.slice(i, i + chunkSize));
//     }
//     return chunks;
//   }

//   // Your existing validation methods with caching
//   private async getCachedTeacher(teacherId: string, qr: QueryRunner): Promise<User> {
//     const cacheKey = `teacher:${teacherId}`;
//     const cached = await this.redis.get(cacheKey);

//     if (cached) {
//       return JSON.parse(cached);
//     }

//     const teacher = await qr.manager.findOne(User, { where: { id: teacherId } });
//     if (!teacher) throw new BadRequestException('Teacher not found');

//     await this.redis.setex(cacheKey, 300, JSON.stringify(teacher));
//     return teacher;
//   }

//   private async validateGradeLevels(dto: CreateTestInput, tenantId: string, qr: QueryRunner) {
//     const cacheKey = `grade_levels:${tenantId}:${dto.tenantGradeLevelIds.sort().join(',')}`;
//     const cached = await this.redis.get(cacheKey);

//     if (cached) {
//       return JSON.parse(cached);
//     }

//     const tenantGradeLevels = await qr.manager.find(TenantGradeLevel, {
//       where: {
//         id: In(dto.tenantGradeLevelIds),
//         tenant: { id: tenantId },
//       },
//       select: ['id'],
//     });

//     if (tenantGradeLevels.length !== dto.tenantGradeLevelIds.length) {
//       const foundIds = tenantGradeLevels.map(gl => gl.id);
//       const missingIds = dto.tenantGradeLevelIds.filter(id => !foundIds.includes(id));
//       throw new BadRequestException(`Grade levels not found: ${missingIds.join(', ')}`);
//     }

//     await this.redis.setex(cacheKey, 300, JSON.stringify(tenantGradeLevels));
//     return tenantGradeLevels;
//   }

//   private async validateSubject(dto: CreateTestInput, tenantId: string, qr: QueryRunner) {
//     const cacheKey = `subject:${tenantId}:${dto.tenantSubjectId}`;
//     const cached = await this.redis.get(cacheKey);

//     if (cached) {
//       return JSON.parse(cached);
//     }

//     const tenantSubject = await qr.manager.findOne(TenantSubject, {
//       where: {
//         id: dto.tenantSubjectId,
//         tenant: { id: tenantId }
//       },
//     });

//     if (!tenantSubject) {
//       throw new BadRequestException(`Subject not found: ${dto.tenantSubjectId}`);
//     }

//     await this.redis.setex(cacheKey, 300, JSON.stringify(tenantSubject));
//     return tenantSubject;
//   }
// }

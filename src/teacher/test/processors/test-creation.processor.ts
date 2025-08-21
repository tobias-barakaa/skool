// import { Process, Processor } from '@nestjs/bull';
// import { Job } from 'bull';
// import { TenantScaleService } from 'src/super_admin/services/tenant-scale.service';
// import { DataSource } from 'typeorm';

// @Processor('test-creation')
// export class TestCreationProcessor {
//   constructor(
//     private readonly dataSource: DataSource,
//     private readonly tenantScaleService: TenantScaleService,
//   ) {}

//   @Process('process-questions-batch')
//   async processQuestionsBatch(
//     job: Job<TestCreationJob> & { batchIndex: number; totalBatches: number },
//   ) {
//     const { testId, tenantId, questions, batchIndex, totalBatches } = job.data;

//     // Get tenant's current config for processing decisions
//     const config = await this.tenantScaleService.getTenantScaleConfig(tenantId);

//     const qr = this.dataSource.createQueryRunner();
//     await qr.connect();
//     await qr.startTransaction();

//     try {
//       const test = await qr.manager.findOne(Test, { where: { id: testId } });
//       if (!test) throw new Error('Test not found');

//       for (const qInput of questions) {
//         const question = qr.manager.create(Question, {
//           ...qInput,
//           test: test,
//         });
//         const savedQuestion = await qr.manager.save(Question, question);

//         if (qInput.options?.length) {
//           const options = qInput.options.map((oInput) =>
//             qr.manager.create(Option, {
//               ...oInput,
//               question: savedQuestion,
//             }),
//           );
//           await qr.manager.save(Option, options);
//         }
//       }

//       await qr.commitTransaction();
//       await job.updateProgress(((batchIndex + 1) / totalBatches) * 100);
//     } catch (error) {
//       await qr.rollbackTransaction();
//       throw error;
//     } finally {
//       await qr.release();
//     }
//   }
// }

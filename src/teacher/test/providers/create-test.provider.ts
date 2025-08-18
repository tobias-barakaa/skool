import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Test } from '../entities/test.entity';
import { Question } from '../entities/question.entity';
import { Option } from '../entities/option.entity';
import { ReferenceMaterial } from '../entities/reference-material.entity';
import { CreateTestInput } from '../dtos/create-test-input.dto';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';
import { Teacher } from 'src/admin/teacher/entities/teacher.entity';
import { User } from 'src/admin/users/entities/user.entity';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';
import { TenantSubject } from 'src/admin/school-type/entities/tenant-specific-subject';


@Injectable()
export class CreateTestProvider {
  constructor(private readonly dataSource: DataSource) {}

  async createTest(
    dto: CreateTestInput,
    teacher: ActiveUserData,
  ): Promise<Test> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // 1. Ensure teacher row exists
      const teacherUser = await qr.manager.findOne(User, {
        where: { id: teacher.sub },
      });
      if (!teacherUser) throw new BadRequestException('User not found');

      // 2. Validate grade levels belong to tenant
      const tenantGradeLevels = await qr.manager.find(TenantGradeLevel, {
        where: {
          id: In(dto.tenantGradeLevelIds),
          tenant: { id: teacher.tenantId },
        },
      });
      if (tenantGradeLevels.length !== dto.tenantGradeLevelIds.length) {
        throw new BadRequestException('One or more grade levels not found');
      }

      // 3. Validate tenant subject
      const tenantSubject = await qr.manager.findOne(TenantSubject, {
        where: { id: dto.tenantSubjectId, tenant: { id: teacher.tenantId } },
      });
      if (!tenantSubject) {
        throw new BadRequestException('Subject not found in tenant');
      }

      // 4. Create the test
      const test = qr.manager.create(Test, {
        title: dto.title,
        subject: tenantSubject,
        gradeLevels: tenantGradeLevels,
        date: dto.date,
        startTime: dto.startTime,
        endTime: dto.endTime,
        duration: dto.duration,
        totalMarks: dto.totalMarks,
        resourceUrl: dto.resourceUrl,
        instructions: dto.instructions,
        teacher: teacherUser,
      });

      const savedTest = await qr.manager.save(Test, test);

      // 5. Add questions (if any)
      if (dto.questions?.length) {
        for (const qInput of dto.questions) {
          const question = qr.manager.create(Question, {
            ...qInput,
            test: savedTest,
          });
          const savedQuestion = await qr.manager.save(Question, question);

          if (qInput.options?.length) {
            for (const oInput of qInput.options) {
              const option = qr.manager.create(Option, {
                ...oInput,
                question: savedQuestion,
              });
              await qr.manager.save(Option, option);
            }
          }
        }
      }

      // 6. Add reference materials (if any)
      if (dto.referenceMaterials?.length) {
        for (const rmInput of dto.referenceMaterials) {
          const material = qr.manager.create(ReferenceMaterial, {
            ...rmInput,
            test: savedTest,
          });
          await qr.manager.save(ReferenceMaterial, material);
        }
      }

      await qr.commitTransaction();
      return savedTest;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async deleteTest(id: string, teacher: ActiveUserData): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // First, verify the test exists and belongs to the teacher
      const test = await queryRunner.manager.findOne(Test, {
        where: { id, teacher: { id: teacher.sub } },
        relations: ['questions', 'questions.options', 'referenceMaterials'],
      });

      if (!test) {
        throw new NotFoundException(
          `Test with id ${id} not found or you don't have permission to delete it`,
        );
      }

      // Delete related data in the correct order to avoid foreign key constraints

      // 1. Delete options
      if (test.questions?.length) {
        for (const question of test.questions) {
          if (question.options?.length) {
            await queryRunner.manager.delete('Option', {
              question: { id: question.id },
            });
          }
        }
      }

      // 2. Delete questions
      if (test.questions?.length) {
        await queryRunner.manager.delete('Question', { test: { id: test.id } });
      }

      // 3. Delete reference materials
      if (test.referenceMaterials?.length) {
        await queryRunner.manager.delete('ReferenceMaterial', {
          test: { id: test.id },
        });
      }

      // 4. Delete the test itself
      await queryRunner.manager.delete('Test', { id: test.id });

      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      console.error('Test deletion error:', error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException(
        `Failed to delete test: ${error.message || error}`,
      );
    } finally {
      await queryRunner.release();
    }
  }
}




// import { Injectable, BadRequestException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository, DataSource } from 'typeorm';
// import { Test } from '../entities/test.entity';
// import { Question } from '../entities/question.entity';
// import { Option } from '../entities/option.entity';
// import { ReferenceMaterial } from '../entities/reference-material.entity';
// import { CreateTestInput } from '../dtos/create-test-input.dto';
// import { User } from 'src/admin/users/entities/user.entity';
// import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
// import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';
// import { Teacher } from 'src/admin/teacher/entities/teacher.entity';

// @Injectable()
// export class CreateTestProvider {
//   constructor(
//     @InjectRepository(Test)
//     private testRepository: Repository<Test>,
//     @InjectRepository(Question)
//     private questionRepository: Repository<Question>,
//     @InjectRepository(Option)
//     private optionRepository: Repository<Option>,
//     @InjectRepository(ReferenceMaterial)
//     private referenceMaterialRepository: Repository<ReferenceMaterial>,
//     private dataSource: DataSource,

//     @InjectRepository(GradeLevel)
//     private gradeLevelRepo: Repository<GradeLevel>,
//     @InjectRepository(Teacher)
//     private teacherRepo: Repository<Teacher>,
//   ) {}

//   async createTest(
//     createTestInput: CreateTestInput,
//     teacher: ActiveUserData,
//   ): Promise<Test> {
//     const queryRunner = this.dataSource.createQueryRunner();
//     await queryRunner.connect();
//     await queryRunner.startTransaction();

//     try {
//       // Create test
//       const test = this.testRepository.create({
//         ...createTestInput,
//         date: new Date(createTestInput.date),
//         teacher,
//         status: 'draft',
//       });

//       const savedTest = await queryRunner.manager.save(test);

//       // Create questions if provided and not empty
//       if (createTestInput.questions && createTestInput.questions.length > 0) {
//         for (const questionInput of createTestInput.questions) {
//           const question = this.questionRepository.create({
//             ...questionInput,
//             test: savedTest,
//           });

//           const savedQuestion = await queryRunner.manager.save(question);

//           // Create options for questions that have them
//           if (questionInput.options && questionInput.options.length > 0) {
//             for (const optionInput of questionInput.options) {
//               const option = this.optionRepository.create({
//                 ...optionInput,
//                 question: savedQuestion,
//               });

//               await queryRunner.manager.save(option);
//             }
//           }
//         }
//       }

//       // Create reference materials if provided and not empty
//       if (
//         createTestInput.referenceMaterials &&
//         createTestInput.referenceMaterials.length > 0
//       ) {
//         for (const materialInput of createTestInput.referenceMaterials) {
//           const material = this.referenceMaterialRepository.create({
//             ...materialInput,
//             test: savedTest,
//           });

//           await queryRunner.manager.save(material);
//         }
//       }

//       await queryRunner.commitTransaction();

//       // Return the complete test with relations
//       const completeTest = await this.testRepository.findOne({
//         where: { id: savedTest.id },
//         relations: [
//           'questions',
//           'questions.options',
//           'referenceMaterials',
//           'teacher',
//         ],
//       });

//       if (!completeTest) {
//         throw new BadRequestException('Test not found after creation.');
//       }

//       return completeTest;
//     } catch (error) {
//       await queryRunner.rollbackTransaction();

//       // Log the actual error for debugging
//       console.error('Test creation error:', error);

//       // Check if it's a validation error
//       if (error.name === 'ValidationError') {
//         throw new BadRequestException(`Validation failed: ${error.message}`);
//       }

//       throw new BadRequestException(`Failed to create test: ${error.message}`);
//     } finally {
//       await queryRunner.release();
//     }
//   }
// }

// import { Injectable, BadRequestException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository, DataSource } from 'typeorm';
// import { Test } from '../entities/test.entity';
// import { Question } from '../entities/question.entity';
// import { Option } from '../entities/option.entity';
// import { ReferenceMaterial } from '../entities/reference-material.entity';
// import { CreateTestInput } from '../dtos/create-test-input.dto';
// import { User } from 'src/admin/users/entities/user.entity';

// @Injectable()
// export class CreateTestProvider {
//   constructor(
//     @InjectRepository(Test)
//     private testRepository: Repository<Test>,
//     @InjectRepository(Question)
//     private questionRepository: Repository<Question>,
//     @InjectRepository(Option)
//     private optionRepository: Repository<Option>,
//     @InjectRepository(ReferenceMaterial)
//     private referenceMaterialRepository: Repository<ReferenceMaterial>,
//     private dataSource: DataSource,
//   ) {}

//   async createTest(createTestInput: CreateTestInput, teacher: User): Promise<Test> {
//     const queryRunner = this.dataSource.createQueryRunner();
//     await queryRunner.connect();
//     await queryRunner.startTransaction();

//     try {
//       // Create test
//       const test = this.testRepository.create({
//         ...createTestInput,
//         date: new Date(createTestInput.date),
//         teacher,
//         status: 'draft',
//       });

//       const savedTest = await queryRunner.manager.save(test);

//       // Create questions if provided
//       if (createTestInput.questions && createTestInput.questions.length > 0) {
//         for (const questionInput of createTestInput.questions) {
//           const question = this.questionRepository.create({
//             ...questionInput,
//             test: savedTest,
//           });

//           const savedQuestion = await queryRunner.manager.save(question);

//           // Create options for multiple choice questions
//           if (questionInput.options && questionInput.options.length > 0) {
//             for (const optionInput of questionInput.options) {
//               const option = this.optionRepository.create({
//                 ...optionInput,
//                 question: savedQuestion,
//               });

//               await queryRunner.manager.save(option);
//             }
//           }
//         }
//       }

//       // Create reference materials if provided
//       if (createTestInput.referenceMaterials && createTestInput.referenceMaterials.length > 0) {
//         for (const materialInput of createTestInput.referenceMaterials) {
//           const material = this.referenceMaterialRepository.create({
//             ...materialInput,
//             test: savedTest,
//           });

//           await queryRunner.manager.save(material);
//         }
//       }

//       await queryRunner.commitTransaction();

//       // Return the complete test with relations
//       const completeTest = await this.testRepository.findOne({
//         where: { id: savedTest.id },
//         relations: ['questions', 'questions.options', 'referenceMaterials', 'teacher'],
//       });

//       if (!completeTest) {
//         throw new BadRequestException('Test not found after creation.');
//       }

//       return completeTest;

//     } catch (error) {
//       await queryRunner.rollbackTransaction();
//       throw new BadRequestException(`Failed to create test: ${error.message}`);
//     } finally {
//       await queryRunner.release();
//     }
//   }
// }

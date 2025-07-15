import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Test } from '../entities/test.entity';
import { Question } from '../entities/question.entity';
import { Option } from '../entities/option.entity';
import { ReferenceMaterial } from '../entities/reference-material.entity';
import { CreateTestInput } from '../dtos/create-test-input.dto';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';
import { Teacher } from 'src/admin/teacher/entities/teacher.entity';
import { User } from 'src/admin/users/entities/user.entity';

@Injectable()
export class CreateTestProvider {
  constructor(
    @InjectRepository(Test)
    private testRepository: Repository<Test>,

    @InjectRepository(Question)
    private questionRepository: Repository<Question>,

    @InjectRepository(Option)
    private optionRepository: Repository<Option>,

    @InjectRepository(ReferenceMaterial)
    private referenceMaterialRepository: Repository<ReferenceMaterial>,

    @InjectRepository(GradeLevel)
    private gradeLevelRepo: Repository<GradeLevel>,

    @InjectRepository(Teacher)
    private teacherRepo: Repository<Teacher>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    private dataSource: DataSource,
  ) {}

  async createTest(
    createTestInput: CreateTestInput,
    teacher: ActiveUserData,
  ): Promise<Test> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 🧠 Step 1: Fetch teacher entity with grade associations


      console.log(teacher, 'teacher data')
      const user = await this.userRepo.findOne({ where: { id: teacher.sub } });
      console.log(user, 'user')

      if (!user) {
        throw new BadRequestException('User not found.');
      }

      const teacherEntity = await this.teacherRepo.findOne({
        where: { userId: teacher.sub },
        relations: ['gradeLevels'],
      });


      console.log(teacherEntity, 'teacher entity not found')

      if (!teacherEntity) {
        throw new BadRequestException('Teacher not found.');
      }

      const allowedGradeIds = teacherEntity.gradeLevels?.map((g) => g.id) || [];

      // 🔐 Step 2: Validate that all input gradeLevelIds are allowed
      const invalidGrades = createTestInput.gradeLevelIds.filter(
        (id) => !allowedGradeIds.includes(id),
      );

      if (invalidGrades.length > 0) {
        throw new BadRequestException(
          `You are not authorized to assign test to these grade levels: ${invalidGrades.join(', ')}`,
        );
      }

      // 🧱 Step 3: Fetch the full GradeLevel entities
      const gradeLevels = await this.gradeLevelRepo.findByIds(
        createTestInput.gradeLevelIds,
      );

      // 📝 Step 4: Create the test
      const test = this.testRepository.create({
        ...createTestInput,
        date: new Date(createTestInput.date),
        teacher: user, // ✅ correct
        gradeLevels,
        status: 'draft',
      });

      const savedTest = await queryRunner.manager.save(test);

      // ❓ Step 5: Add questions (if any)
      if (createTestInput.questions && createTestInput.questions.length > 0) {
        for (const questionInput of createTestInput.questions) {
          const question = this.questionRepository.create({
            ...questionInput,
            test: savedTest,
          });

          const savedQuestion = await queryRunner.manager.save(question);

          if ((questionInput.options ?? []).length > 0) {
            for (const optionInput of questionInput.options ?? []) {
              const option = this.optionRepository.create({
                ...optionInput,
                question: savedQuestion,
              });

              await queryRunner.manager.save(option);
            }
          }
        }
      }

      // 📎 Step 6: Add reference materials (if any)
      if (createTestInput.referenceMaterials && createTestInput.referenceMaterials.length > 0) {
        for (const materialInput of createTestInput.referenceMaterials) {
          const material = this.referenceMaterialRepository.create({
            ...materialInput,
            test: savedTest,
          });

          await queryRunner.manager.save(material);
        }
      }

      await queryRunner.commitTransaction();

      // ✅ Step 7: Return the complete test with relations
      const completeTest = await this.testRepository.findOne({
        where: { id: savedTest.id },
        relations: [
          'questions',
          'questions.options',
          'referenceMaterials',
          'teacher',
          'gradeLevels',
        ],
      });

      if (!completeTest) {
        throw new BadRequestException('Test not found after creation.');
      }

      return completeTest;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      console.error('Test creation error:', error);

      throw new BadRequestException(
        `Failed to create test: ${error.message || error}`,
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

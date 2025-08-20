import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { Test } from '../entities/test.entity';
import { Question } from '../entities/question.entity';
import { Option } from '../entities/option.entity';
import { ReferenceMaterial } from '../entities/reference-material.entity';
import { CreateTestInput } from '../dtos/create-test-input.dto';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { User } from 'src/admin/users/entities/user.entity';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';
import { TenantSubject } from 'src/admin/school-type/entities/tenant-specific-subject';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { SchoolSetupGuardService } from 'src/admin/config/school-config.guard';


@Injectable()
export class CreateTestProvider {
  constructor(private readonly dataSource: DataSource,

        private readonly schoolSetupGuardService: SchoolSetupGuardService,
  ) {}


 async createTest(
    dto: CreateTestInput,
    teacher: ActiveUserData,
  ): Promise<Test> {




        await this.schoolSetupGuardService.validateSchoolIsConfigured(teacher.tenantId);

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      console.log('=== DEBUG: Starting createTest ===');
      console.log('Teacher info:', {
        sub: teacher.sub,
        tenantId: teacher.tenantId,
        email: teacher.email,
      });
      console.log('DTO grade level IDs:', dto.tenantGradeLevelIds);
      console.log('DTO subject ID:', dto.tenantSubjectId);

      // 1. Ensure teacher user exists
      const teacherUser = await qr.manager.findOne(User, {
        where: { id: teacher.sub },
      });
      console.log('Found teacher user:', !!teacherUser);
      if (!teacherUser) throw new BadRequestException('User not found');

      // 2. Debug: Check if tenant exists
      const tenantExists = await qr.manager.findOne(Tenant, {
        where: { id: teacher.tenantId },
      });
      console.log('Tenant exists:', !!tenantExists);
      if (!tenantExists) {
        throw new BadRequestException('Tenant not found');
      }

      // 3. Validate grade levels belong to tenant (with better debugging)
      console.log('=== DEBUG: Checking grade levels ===');

      // First, let's see what grade levels exist for this tenant
      const allTenantGradeLevels = await qr.manager.find(TenantGradeLevel, {
        where: { tenant: { id: teacher.tenantId } },
        select: ['id', 'tenant'],
      });
      console.log('All grade levels for tenant:', allTenantGradeLevels);

      // Now try with the specific IDs
      const tenantGradeLevels = await qr.manager.find(TenantGradeLevel, {
        where: {
          id: In(dto.tenantGradeLevelIds),
          tenant: { id: teacher.tenantId },
        },
        select: ['id'],
      });
      console.log('Found matching grade levels:', tenantGradeLevels);
      console.log('Expected count:', dto.tenantGradeLevelIds.length, 'Actual count:', tenantGradeLevels.length);

      if (tenantGradeLevels.length !== dto.tenantGradeLevelIds.length) {
        const foundIds = tenantGradeLevels.map(gl => gl.id);
        const missingIds = dto.tenantGradeLevelIds.filter(id => !foundIds.includes(id));
        console.log('Missing grade level IDs:', missingIds);
        throw new BadRequestException(`Grade levels not found: ${missingIds.join(', ')}`);
      }

      // 4. Validate tenant subject (with better debugging)
      console.log('=== DEBUG: Checking subject ===');

      // First, let's see what subjects exist for this tenant
      const allTenantSubjects = await qr.manager.find(TenantSubject, {
        where: { tenant: { id: teacher.tenantId } },
        select: ['id'],
      });
      console.log('All subjects for tenant:', allTenantSubjects);

      const tenantSubject = await qr.manager.findOne(TenantSubject, {
        where: {
          id: dto.tenantSubjectId,
          tenant: { id: teacher.tenantId }
        },
      });
      console.log('Found subject:', !!tenantSubject);
      if (!tenantSubject) {
        throw new BadRequestException(`Subject not found: ${dto.tenantSubjectId}`);
      }

      // 5. Create the test
      console.log('=== DEBUG: Creating test ===');
      const test = qr.manager.create(Test, {
        title: dto.title,
        subject: tenantSubject,
        gradeLevels: tenantGradeLevels,
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
        duration: dto.duration,
        totalMarks: dto.totalMarks,
        resourceUrl: dto.resourceUrl,
        instructions: dto.instructions,
        teacher: teacherUser,
      });

      const savedTest = await qr.manager.save(Test, test);
      console.log('Test saved with ID:', savedTest.id);

      // 6. Add questions (if any)
      if (dto.questions?.length) {
        console.log('=== DEBUG: Adding questions ===');
        for (const [index, qInput] of dto.questions.entries()) {
          console.log(`Creating question ${index + 1}:`, {
            text: qInput.text.substring(0, 50) + '...',
            type: qInput.type,
            marks: qInput.marks,
            optionsCount: qInput.options?.length || 0,
          });

          const question = qr.manager.create(Question, {
            ...qInput,
            test: savedTest,
          });
          const savedQuestion = await qr.manager.save(Question, question);

          if (qInput.options?.length) {
            for (const [optIndex, oInput] of qInput.options.entries()) {
              console.log(`  Creating option ${optIndex + 1}: ${oInput.text} (correct: ${oInput.isCorrect})`);
              const option = qr.manager.create(Option, {
                ...oInput,
                question: savedQuestion,
              });
              await qr.manager.save(Option, option);
            }
          }
        }
      }

      // 7. Add reference materials (if any)
      if (dto.referenceMaterials?.length) {
        console.log('=== DEBUG: Adding reference materials ===');
        for (const [index, rmInput] of dto.referenceMaterials.entries()) {
          console.log(`Creating reference material ${index + 1}:`, {
            fileType: rmInput.fileType,
            fileSize: rmInput.fileSize,
          });
          const material = qr.manager.create(ReferenceMaterial, {
            ...rmInput,
            test: savedTest,
          });
          await qr.manager.save(ReferenceMaterial, material);
        }
      }

      await qr.commitTransaction();
      console.log('=== DEBUG: Transaction committed successfully ===');
      return savedTest;
    } catch (err) {
      console.error('=== DEBUG: Error occurred, rolling back ===', err);
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




// {
//    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiOTM0NTg2ZS0yMmYzLTQ5MmQtYjUwMS1iZTI5YWU1ZjE4ZDQiLCJlbWFpbCI6InRvYmlhc2JhcmFrYW5AZ21haWwuY29tIiwidGVuYW50SWQiOiJlZDJjMDIxOC03NTA4LTRmODctYjZkNC1lNTk4ZTAwNjUxYjgiLCJzdWJkb21haW4iOiJub3RuZG93MSIsIm1lbWJlcnNoaXBJZCI6IjZiMTc0NzZmLWFhZWEtNDYxNi04YzFhLTljZjkwZTYwOGY5OSIsImlhdCI6MTc1NTU5NjA1MCwiZXhwIjoxNzU1OTU2MDUwLCJhdWQiOiJsb2NhbGhvc3Q6MzAwMCIsImlzcyI6ImxvY2FsaG9zdDozMDAwIn0.0xtgYRuYvxYM8bF03sVpKvAquW-8n5Ab9FQsn47nMJI"
//  }

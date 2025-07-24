// src/users/providers/users-create-student.provider.ts
import { BadRequestException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HashingProvider } from 'src/admin/auth/providers/hashing.provider';
import { DataSource, Repository } from 'typeorm';
import { CreateStudentInput } from '../dtos/create-student-input.dto';
import { CreateStudentResponse } from '../dtos/student-response.dto';
import { Student } from '../entities/student.entity';
import { MembershipRole, UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { User } from 'src/admin/users/entities/user.entity';
import { BusinessException, UserAlreadyExistsException } from 'src/admin/common/exceptions/business.exception';
import { GradeLevel } from 'src/admin/level/entities/grade-level.entity';
import { SchoolSetupGuardService } from 'src/admin/config/school-config.guard';

@Injectable()
export class UsersCreateStudentProvider {
  private readonly logger = new Logger(UsersCreateStudentProvider.name);

  constructor(
    private readonly hashingProvider: HashingProvider,

    private dataSource: DataSource,
    private readonly schoolSetupGuardService: SchoolSetupGuardService,
  ) {}

  async createStudent(
    createStudentInput: CreateStudentInput,
    tenantId: string,
    subdomain: string,
  ): Promise<CreateStudentResponse> {
    this.logger.log(`Creating student with email: ${createStudentInput.email}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if user already exists
      const existingUser = await queryRunner.manager.findOne(User, {
        where: { email: createStudentInput.email },
      });

      if (existingUser) {
        throw new UserAlreadyExistsException(createStudentInput.email);
      }

      // Check if admission number already exists
      const existingStudent = await queryRunner.manager.findOne(Student, {
        where: { admission_number: createStudentInput.admission_number },
      });

      if (existingStudent) {
        throw new BusinessException(
          `Student with admission number ${createStudentInput.admission_number} already exists`,
          'STUDENT_ADMISSION_EXISTS',
          HttpStatus.CONFLICT,
          { admission_number: createStudentInput.admission_number },
        );
      }

      // ✅ 3. Validate that grade level belongs to tenant (before saving anything)
      const isValidGrade =
        await this.schoolSetupGuardService.validateGradeLevelBelongsToTenant(
          tenantId,
          createStudentInput.grade,
        );
      if (!isValidGrade) {
        throw new BadRequestException(
          `Grade level with ID ${createStudentInput.grade} is not part of the configured school for this tenant`,
        );
      }

      // ✅ 4. Confirm grade level exists
      const gradeLevel = await queryRunner.manager.findOne(GradeLevel, {
        where: { id: createStudentInput.grade },
      });
      if (!gradeLevel) {
        throw new Error(
          `Grade level with ID ${createStudentInput.grade} not found`,
        );
      }

      // Use admission number as password
      const generatedPassword = createStudentInput.admission_number;

      // Create User
      const user = queryRunner.manager.create(User, {
        email: createStudentInput.email,
        password: await this.hashingProvider.hashPassword(generatedPassword),
        name: createStudentInput.name,
        schoolUrl: subdomain,
        isGlobalAdmin: false,
      });

      const savedUser = await queryRunner.manager.save(user);



      const student = queryRunner.manager.create(Student, {
        user_id: savedUser.id,
        admission_number: createStudentInput.admission_number,
        phone: createStudentInput.phone,
        gender: createStudentInput.gender,
        grade: gradeLevel,
        tenant_id: tenantId,
      });

      const savedStudent = await queryRunner.manager.save(student);

      // Create UserTenantMembership
      const membership = queryRunner.manager.create(UserTenantMembership, {
        userId: savedUser.id,
        tenantId: tenantId,
        role: MembershipRole.STUDENT,
        joinedAt: new Date(),
      });

      await queryRunner.manager.save(membership);

      await queryRunner.commitTransaction();

      this.logger.log(
        `Student created successfully with ID: ${savedStudent.id}`,
      );

      return {
        user: savedUser,
        student: savedStudent,
        generatedPassword: generatedPassword,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error creating student: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createMultipleStudents(
    studentsData: CreateStudentInput[],
    tenantId: string,
    schoolUrl: string,
  ): Promise<CreateStudentResponse[]> {
    const results: CreateStudentResponse[] = [];

    for (const studentData of studentsData) {
      try {
        const result = await this.createStudent(
          studentData,
          tenantId,
          schoolUrl,
        );
        results.push(result);
      } catch (error) {
        this.logger.error(
          `Failed to create student ${studentData.email}: ${error.message}`,
        );
        // Continue with other students, but you might want to collect errors
      }
    }

    return results;
  }
}

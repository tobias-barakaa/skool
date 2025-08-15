// src/users/providers/users-create-student.provider.ts
import { BadRequestException, ForbiddenException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HashingProvider } from 'src/admin/auth/providers/hashing.provider';
import { DataSource, Repository } from 'typeorm';
import { CreateStudentInput } from '../dtos/create-student-input.dto';
import { CreateStudentResponse } from '../dtos/student-response.dto';
import { Student } from '../entities/student.entity';
import { MembershipRole, UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { User } from 'src/admin/users/entities/user.entity';
import { BusinessException, UserAlreadyExistsException } from 'src/admin/common/exceptions/business.exception';
import { SchoolSetupGuardService } from 'src/admin/config/school-config.guard';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';

@Injectable()
export class UsersCreateStudentProvider {
  private readonly logger = new Logger(UsersCreateStudentProvider.name);

  constructor(
    private readonly hashingProvider: HashingProvider,

    private dataSource: DataSource,
    private readonly schoolSetupGuardService: SchoolSetupGuardService,

    @InjectRepository(UserTenantMembership)
    private membershipRepository: Repository<UserTenantMembership>,

    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async createStudent(
    createStudentInput: CreateStudentInput,
    currentUser: ActiveUserData,
  ): Promise<CreateStudentResponse> {
    // 1. Verify user's role and get tenant information
    const membership = await this.membershipRepository.findOne({
      where: {
        userId: currentUser.sub,
        role: MembershipRole.SCHOOL_ADMIN,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Only school admins can create students');
    }

    const tenantId = membership.tenantId;

    await this.schoolSetupGuardService.validateSchoolIsConfigured(tenantId);

    await this.schoolSetupGuardService.validateGradeLevelBelongsToTenant(
      tenantId,
      createStudentInput.tenantGradeLevelId,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingUser = await queryRunner.manager.findOne(User, {
        where: { email: createStudentInput.email },
      });

      if (existingUser) {
        throw new UserAlreadyExistsException(createStudentInput.email);
      }

      const existingStudent = await queryRunner.manager.findOne(Student, {
        where: {
          tenant_id: tenantId,
          admission_number: createStudentInput.admission_number,
        },
      });

      if (existingStudent) {
        throw new BusinessException(
          `Student with admission number ${createStudentInput.admission_number} already exists`,
          'STUDENT_ADMISSION_EXISTS',
          HttpStatus.CONFLICT,
          { admission_number: createStudentInput.admission_number },
        );
      }

      const isValidGrade =
        await this.schoolSetupGuardService.validateGradeLevelBelongsToTenant(
          tenantId,
          createStudentInput.tenantGradeLevelId,
        );
      if (!isValidGrade) {
        throw new BadRequestException(
          `Grade level with ID ${createStudentInput.tenantGradeLevelId} is not part of the configured school for this tenant`,
        );
      }

      const tenantGradeLevel = await queryRunner.manager.findOne(
        TenantGradeLevel,
        {
          where: { id: createStudentInput.tenantGradeLevelId },
          relations: ['gradeLevel'],
        },
      );
      if (!tenantGradeLevel) {
        throw new BadRequestException('Invalid grade level for this tenant');
      }
      const gradeLevel = tenantGradeLevel.gradeLevel;
      if (!gradeLevel) {
        throw new Error(
          `Grade level with ID ${createStudentInput.tenantGradeLevelId} not found`,
        );
      }

      const generatedPassword = createStudentInput.admission_number;

      const user = queryRunner.manager.create(User, {
        email: createStudentInput.email,
        password: await this.hashingProvider.hashPassword(generatedPassword),
        name: createStudentInput.name,
        schoolUrl: currentUser.subdomain,
        isGlobalAdmin: false,
      });

      const savedUser = await queryRunner.manager.save(user);

      const student = queryRunner.manager.create(Student, {
        user_id: savedUser.id,
        admission_number: createStudentInput.admission_number,
        phone: createStudentInput.phone,
        gender: createStudentInput.gender,
        grade: tenantGradeLevel.gradeLevel,
        tenant_id: tenantId,
      });

      const savedStudent = await queryRunner.manager.save(student);

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

  async getStudentsByTenantGradeLevel(
    tenantGradeLevelId: string,
    user: ActiveUserData,
  ): Promise<Student[]> {
    // 1. First, get the TenantGradeLevel and its associated GradeLevel
    const tenantGradeLevel = await this.dataSource
      .getRepository(TenantGradeLevel)
      .findOne({
        where: {
          id: tenantGradeLevelId,
          tenant: { id: user.tenantId }, // Ensure it belongs to the tenant
        },
        relations: ['gradeLevel', 'tenant'],
      });

    if (!tenantGradeLevel) {
      throw new BadRequestException(
        `Grade level ${tenantGradeLevelId} is not configured for tenant ${user.tenantId}`,
      );
    }

    // 2. Now fetch students using the actual GradeLevel ID
    return this.studentRepository.find({
      where: {
        tenant_id: user.tenantId,
        grade: { id: tenantGradeLevel.gradeLevel.id }, // Use the actual GradeLevel ID
      },
      relations: ['user', 'grade'],
      order: { createdAt: 'ASC' },
    });
  }

  async getStudentsGroupedByGradeLevel(user: ActiveUserData): Promise<any[]> {
    return this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('student.grade', 'grade')
      .where('student.tenant_id = :tenantId', { tenantId: user.tenantId })
      .andWhere('student.isActive = :isActive', { isActive: true })
      .orderBy('grade.name', 'ASC')
      .addOrderBy('student.createdAt', 'ASC')
      .getMany();
  }

  // Get student counts by grade level
  async getStudentCountsByGradeLevel(user: ActiveUserData): Promise<any[]> {
    return this.studentRepository
      .createQueryBuilder('student')
      .leftJoin('student.grade', 'grade')
      .select('grade.id', 'gradeLevelId')
      .addSelect('grade.name', 'gradeLevelName')
      .addSelect('COUNT(student.id)', 'studentCount')
      .where('student.tenant_id = :tenantId', { tenantId: user.tenantId })
      .andWhere('student.isActive = :isActive', { isActive: true })
      .groupBy('grade.id')
      .addGroupBy('grade.name')
      .orderBy('grade.name', 'ASC')
      .getRawMany();
  }
}

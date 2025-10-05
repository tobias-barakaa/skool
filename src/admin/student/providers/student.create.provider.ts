import { BadRequestException, ForbiddenException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { HashingProvider } from 'src/admin/auth/providers/hashing.provider';
import { DataSource, Like, QueryRunner, Repository } from 'typeorm';
import { CreateStudentInput } from '../dtos/create-student-input.dto';
import { Student } from '../entities/student.entity';
import { MembershipRole, UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { User } from 'src/admin/users/entities/user.entity';
import { BusinessException, UserAlreadyExistsException } from 'src/admin/common/exceptions/business.exception';
import { SchoolSetupGuardService } from 'src/admin/config/school-config.guard';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { FeeAssignment } from 'src/admin/finance/fee-assignment/entities/fee-assignment.entity';
import { FeeStructureItem } from 'src/admin/finance/fee-structure-item/entities/fee-structure-item.entity';
import { StudentFeeAssignment } from 'src/admin/finance/fee-assignment/entities/student_fee_assignments.entity';
import { StudentFeeItem } from 'src/admin/finance/fee-assignment/entities/student_fee_items.entity';
import { randomBytes } from 'crypto';
import { CreateStudentResponse } from '../dtos/student-response.dto';



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
    const membership = await this.validateSchoolAdmin(currentUser);
    await this.schoolSetupGuardService.validateSchoolIsConfigured(membership.tenantId);
    
    return await this.executeStudentCreation(createStudentInput, membership.tenantId, currentUser);
  }

  private async validateSchoolAdmin(currentUser: ActiveUserData) {
    const membership = await this.membershipRepository.findOne({
      where: {
        userId: currentUser.sub,
        role: MembershipRole.SCHOOL_ADMIN,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Only school admins can create students');
    }

    return membership;
  }



  async assignApplicableFeesToStudent(
    queryRunner: QueryRunner,
    student: Student,
    tenantGradeLevelId: string,
    tenantId: string,
  ): Promise<void> {
    const activeFeeAssignments = await queryRunner.manager
      .getRepository(FeeAssignment)
      .createQueryBuilder('fa')
      .innerJoinAndSelect('fa.gradeLevels', 'fagl')
      .innerJoinAndSelect('fa.feeStructure', 'fs')
      .where('fa.tenantId = :tenantId', { tenantId })
      .andWhere('fa.isActive = true')
      .andWhere('fagl.tenantGradeLevelId = :tenantGradeLevelId', {
        tenantGradeLevelId,
      })
      .getMany();

    if (activeFeeAssignments.length === 0) {
      this.logger.log(
        `No active fee assignments found for grade level ${tenantGradeLevelId}`,
      );
      return;
    }

    let assignedCount = 0;

    for (const feeAssignment of activeFeeAssignments) {
      const existingAssignment = await queryRunner.manager
        .getRepository(StudentFeeAssignment)
        .findOne({
          where: {
            studentId: student.id,
            feeAssignmentId: feeAssignment.id,
          },
        });

      if (existingAssignment) {
        this.logger.log(
          `Student ${student.id} already has fee assignment ${feeAssignment.id}`,
        );
        continue;
      }

      const studentFeeAssignment = queryRunner.manager
        .getRepository(StudentFeeAssignment)
        .create({
          tenantId,
          studentId: student.id,
          feeAssignmentId: feeAssignment.id,
        });

      const savedStudentAssignment = await queryRunner.manager.save(
        StudentFeeAssignment,
        studentFeeAssignment,
      );

      const items = await queryRunner.manager.getRepository(FeeStructureItem).find({
        where: {
          tenantId,
          feeStructureId: feeAssignment.feeStructureId,
        },
      });

      if (items.length === 0) {
        this.logger.warn(
          `No fee items found for fee structure ${feeAssignment.feeStructureId}`,
        );
        continue;
      }

      for (const item of items) {
        const studentFeeItem = queryRunner.manager
          .getRepository(StudentFeeItem)
          .create({
            tenantId,
            studentFeeAssignmentId: savedStudentAssignment.id,
            feeStructureItemId: item.id,
            amount: item.amount,
            amountPaid: 0,
            isMandatory: item.isMandatory,
            isActive: true,
          });

        await queryRunner.manager.save(StudentFeeItem, studentFeeItem);
      }

      assignedCount++;
      this.logger.log(
        `Assigned fee assignment ${feeAssignment.id} to student ${student.id}`,
      );
    }

    // Update student's feesOwed
    await this.updateStudentFeesOwed(student.id, queryRunner);

    this.logger.log(
      `Successfully assigned ${assignedCount} fee assignments to student ${student.id}`,
    );
  }


  private async updateStudentFeesOwed(
    studentId: string,
    queryRunner?: QueryRunner,
  ): Promise<void> {
    const manager = queryRunner ? queryRunner.manager : this.dataSource.manager;

    const result = await manager.query(
      `
      SELECT COALESCE(SUM(sfi.amount), 0) as total_owed
      FROM student_fee_items sfi
      JOIN student_fee_assignments sfa ON sfi."studentFeeAssignmentId" = sfa.id
      WHERE sfa."studentId" = $1 AND sfi."isActive" = true
    `,
      [studentId],
    );

    const totalOwed = parseFloat(result[0]?.total_owed || 0);

    await manager
      .getRepository(Student)
      .update({ id: studentId }, { feesOwed: totalOwed });
  }

  // async assignApplicableFeesToStudent(
  //   queryRunner: QueryRunner,
  //   student: Student,
  //   tenantGradeLevelId: string,
  //   tenantId: string
  // ): Promise<void> {
    
  //   const activeFeeAssignments = await queryRunner.manager
  //     .getRepository(FeeAssignment)
  //     .createQueryBuilder('fa')
  //     .innerJoinAndSelect('fa.gradeLevels', 'fagl')
  //     .innerJoinAndSelect('fa.feeStructure', 'fs')
  //     .where('fa.tenantId = :tenantId', { tenantId })
  //     .andWhere('fa.isActive = true')
  //     .andWhere('fagl.tenantGradeLevelId = :tenantGradeLevelId', { tenantGradeLevelId })
  //     .getMany();

  //   if (activeFeeAssignments.length === 0) {
  //     this.logger.log(`No active fee assignments found for grade level ${tenantGradeLevelId}`);
  //     return;
  //   }

  //   let assignedCount = 0;

  //   for (const feeAssignment of activeFeeAssignments) {
  //     const existingAssignment = await queryRunner.manager
  //       .getRepository(StudentFeeAssignment)
  //       .findOne({
  //         where: {
  //           studentId: student.id,
  //           feeAssignmentId: feeAssignment.id,
  //         },
  //       });

  //     if (existingAssignment) {
  //       this.logger.log(`Student ${student.id} already has fee assignment ${feeAssignment.id}`);
  //       continue;
  //     }

  //     const studentFeeAssignment = this.dataSource.getRepository(StudentFeeAssignment);
  //     const studentAssignment = studentFeeAssignment.create({
  //       tenantId,
  //       studentId: student.id,
  //       feeAssignmentId: feeAssignment.id,
  //     });

  //     const savedStudentAssignment = await queryRunner.manager.save(StudentFeeAssignment, studentAssignment);

  //     const items = await queryRunner.manager
  //       .getRepository(FeeStructureItem)
  //       .find({
  //         where: { 
  //           tenantId, 
  //           feeStructureId: feeAssignment.feeStructureId 
  //         },
  //       });

  //     if (items.length === 0) {
  //       this.logger.warn(`No fee items found for fee structure ${feeAssignment.feeStructureId}`);
  //       continue;
  //     }

  //     const studentFeeItemRepo = this.dataSource.getRepository(StudentFeeItem);

  //     for (const item of items) {
  //       const studentFeeItem = studentFeeItemRepo.create({
  //         tenantId,
  //         studentFeeAssignmentId: savedStudentAssignment.id,
  //         feeStructureItemId: item.id,
  //         amount: item.amount,
  //         isMandatory: item.isMandatory,
  //         isActive: true,
  //       });

  //       await queryRunner.manager.save(StudentFeeItem, studentFeeItem);
  //     }

  //     assignedCount++;
  //     this.logger.log(`Assigned fee assignment ${feeAssignment.id} to student ${student.id}`);
  //   }

  //   this.logger.log(`Successfully assigned ${assignedCount} fee assignments to student ${student.id}`);
  // }

  async updateFeeAssignmentForFutureStudents(
    feeAssignmentId: string,
    tenantId: string
  ): Promise<void> {
    const feeAssignmentRepo = this.dataSource.getRepository(FeeAssignment);

    const feeAssignment = await feeAssignmentRepo.findOne({
      where: { id: feeAssignmentId, tenantId },
      relations: ['gradeLevels'],
    });

    if (!feeAssignment) {
      throw new BadRequestException('Fee assignment not found');
    }

    const tenantGradeLevelIds = feeAssignment.gradeLevels.map(gl => gl.tenantGradeLevelId);
    
    const unassignedStudents = await this.dataSource
      .getRepository(Student)
      .createQueryBuilder('student')
      .where('student.tenant_id = :tenantId', { tenantId })
      .andWhere('student.grade_level_id IN (:...tenantGradeLevelIds)', { tenantGradeLevelIds })
      .andWhere('student.isActive = true')
      .andWhere(`student.id NOT IN (
        SELECT sfa.studentId 
        FROM student_fee_assignments sfa 
        WHERE sfa.feeAssignmentId = :feeAssignmentId
      )`, { feeAssignmentId })
      .getMany();

    for (const student of unassignedStudents) {
      await this.assignApplicableFeesToStudent(
        this.dataSource.createQueryRunner(),
        student,
        student.grade.id, 
        tenantId
      );
    }
  }



private async executeStudentCreation(
  input: CreateStudentInput, 
  tenantId: string, 
  currentUser: ActiveUserData
): Promise<CreateStudentResponse> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    await this.validateStudentData(queryRunner, input, tenantId);
    
    const tenantGradeLevel = await this.getValidatedGradeLevel(queryRunner, input.tenantGradeLevelId);
    
    const generatedPassword = input.admission_number;

    const user = await this.createUserRecord(queryRunner, input, currentUser, generatedPassword);
    const student = await this.createStudentRecord(queryRunner, input, user, tenantGradeLevel, tenantId);

    await this.assignApplicableFeesToStudent(
      queryRunner,
      student,
      input.tenantGradeLevelId, 
      tenantId
    );
    
    await this.assignApplicableFeesToStudent(queryRunner, student, tenantGradeLevel.id, tenantId);
    
    await this.createStudentMembership(queryRunner, user.id, tenantId);
    
    await queryRunner.commitTransaction();
    
    this.logger.log(`Student created successfully with ID: ${student.id}`);
    
    return {
      user,
      student,
      generatedPassword,
    };
  } catch (error) {
    await queryRunner.rollbackTransaction();
    this.logger.error(`Error creating student: ${error.message}`, error.stack);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
  





private async validateStudentData(
  queryRunner: QueryRunner, 
  input: CreateStudentInput, 
  tenantId: string
): Promise<void> {
  if (!this.isValidEmail(input.email)) {
    throw new BadRequestException('Invalid email format');
  }

  const existingUser = await queryRunner.manager.findOne(User, {
    where: { email: input.email },
  });

  if (existingUser) {
    throw new UserAlreadyExistsException(input.email);
  }

  const existingStudent = await queryRunner.manager.findOne(Student, {
    where: {
      tenant_id: tenantId,
      admission_number: input.admission_number,
    },
  });

  if (existingStudent) {
    throw new BusinessException(
      `Student with admission number ${input.admission_number} already exists`,
      'STUDENT_ADMISSION_EXISTS',
      HttpStatus.CONFLICT,
      { admission_number: input.admission_number },
    );
  }

  

  const isValidGrade = await this.schoolSetupGuardService.validateGradeLevelBelongsToTenant(
    tenantId,
    input.tenantGradeLevelId,
  );

  if (!isValidGrade) {
    throw new BadRequestException(
      `Grade level with ID ${input.tenantGradeLevelId} is not part of the configured school for this tenant`,
    );
  }
}

private async getValidatedGradeLevel(
  queryRunner: QueryRunner, 
  tenantGradeLevelId: string
): Promise<TenantGradeLevel> {
  const tenantGradeLevel = await queryRunner.manager.findOne(TenantGradeLevel, {
    where: { id: tenantGradeLevelId },
    relations: ['gradeLevel'],
  });

  if (!tenantGradeLevel) {
    throw new BadRequestException('Invalid grade level for this tenant');
  }

  if (!tenantGradeLevel.gradeLevel) {
    throw new BadRequestException(
      `Grade level with ID ${tenantGradeLevelId} not found`
    );
  }

  return tenantGradeLevel;
}

private generateSecurePassword(): string {
  const length = 12;
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytes(1)[0] % charset.length;
    password += charset[randomIndex];
  }
  
  return password;
}



private async createUserRecord(
  queryRunner: QueryRunner,
  input: CreateStudentInput,
  currentUser: ActiveUserData,
  generatedPassword: string,
): Promise<User> {
  const user = queryRunner.manager.create(User, {
    email: input.email,
    password: await this.hashingProvider.hashPassword(generatedPassword),
    name: input.name,
    schoolUrl: currentUser.subdomain,
    isGlobalAdmin: false,
  });

  return await queryRunner.manager.save(user);
}

private async createStudentRecord(
  queryRunner: QueryRunner,
  input: CreateStudentInput,
  user: User,
  tenantGradeLevel: TenantGradeLevel,
  tenantId: string,
): Promise<Student> {
  const student = queryRunner.manager.create(Student, {
    user,
    admission_number: input.admission_number,
    phone: input.phone,
    gender: input.gender,
    grade: tenantGradeLevel,
    tenant: { id: tenantId },
    schoolType: input.schoolType ?? 'day',
  });

  return await queryRunner.manager.save(student);
}





private async createStudentMembership(
  queryRunner: QueryRunner,
  userId: string,
  tenantId: string,
): Promise<void> {
  const membership = queryRunner.manager.create(UserTenantMembership, {
    userId,
    tenantId,
    role: MembershipRole.STUDENT,
    joinedAt: new Date(),
  });

  await queryRunner.manager.save(membership);
}

private isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}



async getTenantLoginInfo(tenantId: string) {
  return this.studentRepository
    .createQueryBuilder('student')
    .innerJoinAndSelect('student.user', 'user')
    .innerJoinAndSelect('student.grade', 'tg')
    .innerJoinAndSelect('tg.gradeLevel', 'grade')
    .where('student.tenant_id = :tenantId', { tenantId })
    .select([
      'student.id',
      'student.admission_number',
      'user.email',
      'user.name',
      'grade.id',
      'grade.name',
    ])
    .getMany()
    .then((rows) =>
      rows.map((r) => ({
        id: r.id,
        email: r.user.email,
        admissionNumber: r.admission_number,
        name: r.user.name,
        grade: {
          id: r.grade.gradeLevel.id,
          name: r.grade.gradeLevel.name,
        },
      })),
    );
}
async getStudentsByTenantGradeLevel(
  tenantGradeLevelId: string,
  user: ActiveUserData,
): Promise<Student[]> {
  const tenantGradeLevel = await this.dataSource
    .getRepository(TenantGradeLevel)
    .findOne({
      where: {
        id: tenantGradeLevelId,
        tenant: { id: user.tenantId },
      },
      relations: ['gradeLevel', 'tenant'],
    });

  if (!tenantGradeLevel) {
    throw new BadRequestException(
      `Grade level ${tenantGradeLevelId} is not configured for tenant ${user.tenantId}`,
    );
  }

  return this.studentRepository.find({
    where: {
      tenant_id: user.tenantId,
      grade: { id: tenantGradeLevel.gradeLevel.id },
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



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
    tenantId: string
  ): Promise<void> {
    
    const activeFeeAssignments = await queryRunner.manager
      .getRepository(FeeAssignment)
      .createQueryBuilder('fa')
      .innerJoinAndSelect('fa.gradeLevels', 'fagl')
      .innerJoinAndSelect('fa.feeStructure', 'fs')
      .where('fa.tenantId = :tenantId', { tenantId })
      .andWhere('fa.isActive = true')
      .andWhere('fagl.tenantGradeLevelId = :tenantGradeLevelId', { tenantGradeLevelId })
      .getMany();

    if (activeFeeAssignments.length === 0) {
      this.logger.log(`No active fee assignments found for grade level ${tenantGradeLevelId}`);
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
        this.logger.log(`Student ${student.id} already has fee assignment ${feeAssignment.id}`);
        continue;
      }

      const studentFeeAssignment = this.dataSource.getRepository(StudentFeeAssignment);
      const studentAssignment = studentFeeAssignment.create({
        tenantId,
        studentId: student.id,
        feeAssignmentId: feeAssignment.id,
      });

      const savedStudentAssignment = await queryRunner.manager.save(StudentFeeAssignment, studentAssignment);

      const items = await queryRunner.manager
        .getRepository(FeeStructureItem)
        .find({
          where: { 
            tenantId, 
            feeStructureId: feeAssignment.feeStructureId 
          },
        });

      if (items.length === 0) {
        this.logger.warn(`No fee items found for fee structure ${feeAssignment.feeStructureId}`);
        continue;
      }

      const studentFeeItemRepo = this.dataSource.getRepository(StudentFeeItem);

      for (const item of items) {
        const studentFeeItem = studentFeeItemRepo.create({
          tenantId,
          studentFeeAssignmentId: savedStudentAssignment.id,
          feeStructureItemId: item.id,
          amount: item.amount,
          isMandatory: item.isMandatory,
          isActive: true,
        });

        await queryRunner.manager.save(StudentFeeItem, studentFeeItem);
      }

      assignedCount++;
      this.logger.log(`Assigned fee assignment ${feeAssignment.id} to student ${student.id}`);
    }

    this.logger.log(`Successfully assigned ${assignedCount} fee assignments to student ${student.id}`);
  }

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
    
    const generatedPassword = this.generateSecurePassword();
    
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




// private async checkFeeTablesExist(queryRunner: QueryRunner): Promise<boolean> {
//   try {
//     const requiredTables = [
//       'fee_assignments',
//       'fee_structure_items', 
//       'student_fee_assignments',
//       'student_fee_items'
//     ];

//     const result = await queryRunner.query(`
//       SELECT 
//         ${requiredTables.map(table => `
//           EXISTS (
//             SELECT FROM information_schema.tables 
//             WHERE table_schema = 'public' 
//             AND table_name = '${table}'
//           ) as ${table}_exists
//         `).join(',\n')}
//     `);

//     const tables = result[0];
//     const allTablesExist = requiredTables.every(table => tables[`${table}_exists`]);
    
//     if (!allTablesExist) {
//       const missingTables = requiredTables.filter(table => !tables[`${table}_exists`]);
//       this.logger.log(`Missing fee tables: ${missingTables.join(', ')}`);
//     }
    
//     return allTablesExist;
//   } catch (error) {
//     this.logger.error('Error checking fee table existence:', error.message);
//     return false;
//   }
// }



// private async getFeeStructureItems(
//   queryRunner: QueryRunner,
//   feeStructureId: string,
//   tenantId: string,
// ): Promise<FeeStructureItem[]> {
//   try {
//     return await queryRunner.manager.find(FeeStructureItem, {
//       where: { 
//         tenantId, 
//         feeStructureId 
//       },
//     });
//   } catch (error) {
//     if (error.message?.includes('does not exist') || error.code === '42P01') {
//       this.logger.log('Fee structure items table does not exist. Returning empty array.');
//       return [];
//     }
//     throw error;
//   }
// }

// private async incrementAssignmentCount(
//   queryRunner: QueryRunner,
//   feeAssignment: FeeAssignment,
// ): Promise<void> {
//   feeAssignment.studentsAssignedCount = (feeAssignment.studentsAssignedCount ?? 0) + 1;
//   await queryRunner.manager.save(feeAssignment);
// }




// private async getFeeAssignmentsForGrade(
//   queryRunner: QueryRunner,
//   gradeId: string,
//   tenantId: string,
// ): Promise<FeeAssignment[]> {
//   try {
//     return await queryRunner.manager
//       .createQueryBuilder(FeeAssignment, 'fa')
//       .where('fa.tenantId = :tenantId', { tenantId })
//       .andWhere('fa.isActive = true')
//       .andWhere(':gradeId = ANY(string_to_array(fa.tenantGradeLevelIds, \',\'))', { gradeId })
//       .getMany();
//   } catch (error) {
//     if (error.message?.includes('does not exist') || error.code === '42P01') {
//       this.logger.log('Fee assignment table does not exist. Returning empty array.');
//       return [];
//     }
//     throw error;
//   }
// }





// private async createStudentFeeAssignment(
//   queryRunner: QueryRunner,
//   feeAssignment: FeeAssignment,
//   studentId: string,
//   tenantId: string,
// ): Promise<void> {
//   try {
//     const existingAssignment = await queryRunner.manager.findOne(StudentFeeAssignment, {
//       where: {
//         tenantId,
//         studentId,
//         feeAssignmentId: feeAssignment.id,
//       },
//     });

//     if (existingAssignment) {
//       this.logger.log(`Student fee assignment already exists for student ${studentId} and fee assignment ${feeAssignment.id}`);
//       return;
//     }

//     const studentAssignment = queryRunner.manager.create(StudentFeeAssignment, {
//       tenantId,
//       studentId,
//       feeAssignmentId: feeAssignment.id,
//     });

//     const savedStudentAssignment = await queryRunner.manager.save(studentAssignment);

//     const feeStructureItems = await this.getFeeStructureItems(
//       queryRunner,
//       feeAssignment.feeStructureId,
//       tenantId
//     );

//     if (feeStructureItems.length === 0) {
//       this.logger.log(`No fee structure items found for fee structure ${feeAssignment.feeStructureId}`);
//       return;
//     }

//     const batchSize = 100;
//     for (let i = 0; i < feeStructureItems.length; i += batchSize) {
//       const batch = feeStructureItems.slice(i, i + batchSize);
      
//       const studentFeeItems = batch.map(item =>
//         queryRunner.manager.create(StudentFeeItem, {
//           tenantId,
//           studentFeeAssignmentId: savedStudentAssignment.id,
//           feeStructureItemId: item.id,
//           amount: item.amount,
//           isMandatory: item.isMandatory,
//           isActive: item.isMandatory,
//         })
//       );

//       await queryRunner.manager.save(studentFeeItems);
//     }
//   } catch (error) {
//     if (error.message?.includes('does not exist') || error.code === '42P01') {
//       this.logger.log('Fee-related tables do not exist. Skipping fee assignment creation.');
//       return;
//     }
//     throw error;
//   }
// }


// private async assignFeeStructures(
//   queryRunner: QueryRunner,
//   student: Student,
//   tenantGradeLevel: TenantGradeLevel,
//   tenantId: string,
// ): Promise<void> {
//   try {
//     const hasFeeTables = await this.checkFeeTablesExist(queryRunner);
    
//     if (!hasFeeTables) {
//       this.logger.log('Fee assignment tables not found. Skipping fee assignment for student creation.');
//       return;
//     }

//     const feeAssignments = await this.getFeeAssignmentsForGrade(
//       queryRunner,
//       tenantGradeLevel.id,
//       tenantId
//     );

//     if (feeAssignments.length === 0) {
//       this.logger.log(`No fee assignments found for grade level ${tenantGradeLevel.id}. Student created without fee assignments.`);
//       return;
//     }

//     let successCount = 0;
//     for (const assignment of feeAssignments) {
//       try {
//         await this.createStudentFeeAssignment(queryRunner, assignment, student.id, tenantId);
//         await this.incrementAssignmentCount(queryRunner, assignment);
//         successCount++;
//       } catch (assignmentError) {
//         this.logger.error(`Failed to assign fee structure ${assignment.id} to student ${student.id}: ${assignmentError.message}`);
//       }
//     }

//     this.logger.log(`Successfully assigned ${successCount}/${feeAssignments.length} fee structures to student ${student.id}`);
//   } catch (error) {
//     if (error.message?.includes('does not exist') || error.code === '42P01') {
//       this.logger.log('Fee-related tables do not exist yet. Student created without fee assignments.');
//       return;
//     }
    
//     if (error.code === '25P02') { 
//       this.logger.error('Transaction aborted during fee assignment. This indicates a previous error in the transaction.');
//       throw new Error('Transaction was aborted during fee assignment. Please check previous operations.');
//     }
    
//     throw error;
//   }
// }

  // private async executeStudentCreation(
  //   input: CreateStudentInput, 
  //   tenantId: string, 
  //   currentUser: ActiveUserData
  // ): Promise<CreateStudentResponse> {
  //   const queryRunner = this.dataSource.createQueryRunner();
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();

  //   try {
  //     await this.validateStudentData(queryRunner, input, tenantId);
      
  //     const tenantGradeLevel = await this.getValidatedGradeLevel(queryRunner, input.tenantGradeLevelId);
      
  //     const generatedPassword = this.generateSecurePassword();
      
  //     const user = await this.createUserRecord(queryRunner, input, currentUser, generatedPassword);
  //     const student = await this.createStudentRecord(queryRunner, input, user, tenantGradeLevel, tenantId);
      
  //     await this.assignFeeStructures(queryRunner, student, tenantGradeLevel, tenantId);
      
  //     await this.createStudentMembership(queryRunner, user.id, tenantId);
      
  //     await queryRunner.commitTransaction();
      
  //     this.logger.log(`Student created successfully with ID: ${student.id}`);
      
  //     return {
  //       user,
  //       student,
  //       generatedPassword,
  //     };
  //   } catch (error) {
  //     await queryRunner.rollbackTransaction();
  //     this.logger.error(`Error creating student: ${error.message}`, error.stack);
  //     throw error;
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }


  // private async assignFeeStructuresWithRetry(
  //   queryRunner: QueryRunner,
  //   student: Student,
  //   tenantGradeLevel: TenantGradeLevel,
  //   tenantId: string,
  //   maxRetries: number = 3
  // ): Promise<void> {
  //   let attempt = 0;
    
  //   while (attempt < maxRetries) {
  //     try {
  //       await this.assignFeeStructures(queryRunner, student, tenantGradeLevel, tenantId);
  //       return; 
  //     } catch (error) {
  //       attempt++;
        
  //       if (error.code === '42P01' || error.message?.includes('does not exist')) {
  //         this.logger.log('Tables do not exist, skipping fee assignment');
  //         return;
  //       }
        
  //       if (attempt >= maxRetries) {
  //         this.logger.error(`Failed to assign fee structures after ${maxRetries} attempts: ${error.message}`);
  //         throw error;
  //       }
        
  //       const waitTime = Math.pow(2, attempt) * 1000; 
  //       this.logger.warn(`Fee assignment attempt ${attempt} failed, retrying in ${waitTime}ms: ${error.message}`);
  //       await new Promise(resolve => setTimeout(resolve, waitTime));
  //     }
  //   }
  // }


  // private async executeStudentCreation(
  //   input: CreateStudentInput, 
  //   tenantId: string, 
  //   currentUser: ActiveUserData
  // ): Promise<CreateStudentResponse> {
  //   const queryRunner = this.dataSource.createQueryRunner();
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();
  
  //   try {
  //     await this.validateStudentData(queryRunner, input, tenantId);
      
  //     const tenantGradeLevel = await this.getValidatedGradeLevel(queryRunner, input.tenantGradeLevelId);
      
  //     const generatedPassword = this.generateSecurePassword();
      
  //     const user = await this.createUserRecord(queryRunner, input, currentUser, generatedPassword);
  //     const student = await this.createStudentRecord(queryRunner, input, user, tenantGradeLevel, tenantId);
      
  //     try {
  //       await this.assignFeeStructures(queryRunner, student, tenantGradeLevel, tenantId);
  //     } catch (feeError) {
  //       this.logger.warn(`Fee assignment failed for student ${student.id}: ${feeError.message}`, feeError.stack);
  //     }
      
  //     await this.createStudentMembership(queryRunner, user.id, tenantId);
      
  //     await queryRunner.commitTransaction();
      
  //     this.logger.log(`Student created successfully with ID: ${student.id}`);
      
  //     return {
  //       user,
  //       student,
  //       generatedPassword,
  //     };
  //   } catch (error) {
  //     try {
  //       await queryRunner.rollbackTransaction();
  //     } catch (rollbackError) {
  //       this.logger.error(`Failed to rollback transaction: ${rollbackError.message}`);
  //     }
      
  //     this.logger.error(`Error creating student: ${error.message}`, error.stack);
  //     throw error;
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }

  // private async assignFeeStructures(
  //   queryRunner: QueryRunner,
  //   student: Student,
  //   tenantGradeLevel: TenantGradeLevel,
  //   tenantId: string,
  // ): Promise<void> {
  //   try {
  //     const hasFeeTables = await this.checkFeeTablesExist(queryRunner);
      
  //     if (!hasFeeTables) {
  //       this.logger.log('Fee assignment tables not found. Skipping fee assignment for student creation.');
  //       return;
  //     }

  //     const feeAssignments = await this.getFeeAssignmentsForGrade(
  //       queryRunner,
  //       tenantGradeLevel.id,
  //       tenantId
  //     );

  //     if (feeAssignments.length === 0) {
  //       this.logger.log(`No fee assignments found for grade level ${tenantGradeLevel.id}. Student created without fee assignments.`);
  //       return;
  //     }

  //     await Promise.all(
  //       feeAssignments.map(async (assignment) => {
  //         await this.createStudentFeeAssignment(queryRunner, assignment, student.id, tenantId);
  //         await this.incrementAssignmentCount(queryRunner, assignment);
  //       })
  //     );

  //     this.logger.log(`Successfully assigned ${feeAssignments.length} fee structures to student ${student.id}`);
  //   } catch (error) {
  //     if (error.message?.includes('does not exist') || error.code === '42P01') {
  //       this.logger.log('Fee-related tables do not exist yet. Student created without fee assignments.');
  //       return;
  //     }
      
  //     throw error;
  //   }
  // }

  // private async checkFeeTablesExist(queryRunner: QueryRunner): Promise<boolean> {
  //   try {
  //     const result = await queryRunner.query(`
  //       SELECT EXISTS (
  //         SELECT FROM information_schema.tables 
  //         WHERE table_schema = 'public' 
  //         AND table_name = 'fee_assignments'
  //       ) as fee_assignments_exists,
  //       EXISTS (
  //         SELECT FROM information_schema.tables 
  //         WHERE table_schema = 'public' 
  //         AND table_name = 'fee_structure_items'
  //       ) as fee_structure_items_exists,
  //       EXISTS (
  //         SELECT FROM information_schema.tables 
  //         WHERE table_schema = 'public' 
  //         AND table_name = 'student_fee_assignments'
  //       ) as student_fee_assignments_exists,
  //       EXISTS (
  //         SELECT FROM information_schema.tables 
  //         WHERE table_schema = 'public' 
  //         AND table_name = 'student_fee_items'
  //       ) as student_fee_items_exists;
  //     `);

  //     const tables = result[0];
  //     return tables.fee_assignments_exists && 
  //            tables.fee_structure_items_exists && 
  //            tables.student_fee_assignments_exists && 
  //            tables.student_fee_items_exists;
  //   } catch (error) {
  //     this.logger.error('Error checking fee table existence:', error.message);
  //     return false;
  //   }
  // }


  // private async getFeeAssignmentsForGrade(
  //   queryRunner: QueryRunner,
  //   gradeId: string,
  //   tenantId: string,
  // ): Promise<FeeAssignment[]> {
  //   try {
  //     return await queryRunner.manager.find(FeeAssignment, {
  //       where: {
  //         tenantId,
  //         tenantGradeLevelIds: Like(`%${gradeId}%`),
  //         isActive: true,
  //       },
  //     });
  //   } catch (error) {
  //     if (error.message?.includes('does not exist') || error.code === '42P01') {
  //       this.logger.log('Fee assignment table does not exist. Returning empty array.');
  //       return [];
  //     }
  //     throw error;
  //   }
  // }

  // private async createStudentFeeAssignment(
  //   queryRunner: QueryRunner,
  //   feeAssignment: FeeAssignment,
  //   studentId: string,
  //   tenantId: string,
  // ): Promise<void> {
  //   try {
  //     const studentAssignment = queryRunner.manager.create(StudentFeeAssignment, {
  //       tenantId,
  //       studentId,
  //       feeAssignmentId: feeAssignment.id,
  //     });

  //     const savedStudentAssignment = await queryRunner.manager.save(studentAssignment);

  //     const feeStructureItems = await this.getFeeStructureItems(
  //       queryRunner,
  //       feeAssignment.feeStructureId,
  //       tenantId
  //     );

  //     if (feeStructureItems.length === 0) {
  //       this.logger.log(`No fee structure items found for fee structure ${feeAssignment.feeStructureId}`);
  //       return;
  //     }

  //     const studentFeeItems = feeStructureItems.map(item =>
  //       queryRunner.manager.create(StudentFeeItem, {
  //         tenantId,
  //         studentFeeAssignmentId: savedStudentAssignment.id,
  //         feeStructureItemId: item.id,
  //         amount: item.amount,
  //         isMandatory: item.isMandatory,
  //         isActive: item.isMandatory,
  //       })
  //     );

  //     await queryRunner.manager.save(studentFeeItems);
  //   } catch (error) {
  //     if (error.message?.includes('does not exist') || error.code === '42P01') {
  //       this.logger.log('Fee-related tables do not exist. Skipping fee assignment creation.');
  //       return;
  //     }
  //     throw error;
  //   }
  // }



  // async createStudent(
  //   createStudentInput: CreateStudentInput,
  //   currentUser: ActiveUserData,
  // ): Promise<CreateStudentResponse> {
  //   const membership = await this.membershipRepository.findOne({
  //     where: {
  //       userId: currentUser.sub,
  //       role: MembershipRole.SCHOOL_ADMIN,
  //     },
  //   });

  //   if (!membership) {
  //     throw new ForbiddenException('Only school admins can create students');
  //   }

  //   const tenantId = membership.tenantId;

  //   await this.schoolSetupGuardService.validateSchoolIsConfigured(tenantId);

  //  const queryRunner = this.dataSource.createQueryRunner();
  //   await queryRunner.connect();
  //   await queryRunner.startTransaction();

  //   try {
  //     const existingUser = await queryRunner.manager.findOne(User, {
  //       where: { email: createStudentInput.email },
  //     });

  //     if (existingUser) {
  //       throw new UserAlreadyExistsException(createStudentInput.email);
  //     }

  //     const existingStudent = await queryRunner.manager.findOne(Student, {
  //       where: {
  //         tenant_id: tenantId,
  //         admission_number: createStudentInput.admission_number,
  //       },
  //     });

  //     if (existingStudent) {
  //       throw new BusinessException(
  //         `Student with admission number ${createStudentInput.admission_number} already exists`,
  //         'STUDENT_ADMISSION_EXISTS',
  //         HttpStatus.CONFLICT,
  //         { admission_number: createStudentInput.admission_number },
  //       );
  //     }

  //     const isValidGrade =
  //       await this.schoolSetupGuardService.validateGradeLevelBelongsToTenant(
  //         tenantId,
  //         createStudentInput.tenantGradeLevelId,
  //       );
  //     if (!isValidGrade) {
  //       throw new BadRequestException(
  //         `Grade level with ID ${createStudentInput.tenantGradeLevelId} is not part of the configured school for this tenant`,
  //       );
  //     }

  //     const tenantGradeLevel = await queryRunner.manager.findOne(
  //       TenantGradeLevel,
  //       {
  //         where: { id: createStudentInput.tenantGradeLevelId },
  //         relations: ['gradeLevel'],
  //       },
  //     );
  //     if (!tenantGradeLevel) {
  //       throw new BadRequestException('Invalid grade level for this tenant');
  //     }
  //     const gradeLevel = tenantGradeLevel.gradeLevel;
  //     if (!gradeLevel) {
  //       throw new Error(
  //         `Grade level with ID ${createStudentInput.tenantGradeLevelId} not found`,
  //       );
  //     }

  //     const generatedPassword = createStudentInput.admission_number;

  //     const user = queryRunner.manager.create(User, {
  //       email: createStudentInput.email,
  //       password: await this.hashingProvider.hashPassword(generatedPassword),
  //       name: createStudentInput.name,
  //       schoolUrl: currentUser.subdomain,
  //       isGlobalAdmin: false,
  //     });

  //     const savedUser = await queryRunner.manager.save(user);

  //    const student = queryRunner.manager.create(Student, {
  //      user: savedUser,
  //      admission_number: createStudentInput.admission_number,
  //      phone: createStudentInput.phone,
  //      gender: createStudentInput.gender,
  //      grade: tenantGradeLevel,
  //      tenant: { id: tenantId },
  //      schoolType: createStudentInput.schoolType ?? 'day'
  //    });

  //     const savedStudent = await queryRunner.manager.save(student);




  //     const feeAssignments = await queryRunner.manager.find(FeeAssignment, {
  //       where: {
  //         tenantId,
  //         tenantGradeLevelIds: Like(`%${tenantGradeLevel.id}%`),
  //         isActive: true,
  //       },
  //     });
      
  //     for (const fa of feeAssignments) {
  //       const items = await queryRunner.manager.find(FeeStructureItem, {
  //         where: { tenantId, feeStructureId: fa.feeStructureId },
  //       });
      
  //       const studentAssignment = queryRunner.manager.create(StudentFeeAssignment, {
  //         tenantId,
  //         studentId: savedStudent.id,
  //         feeAssignmentId: fa.id,
  //       });
      
  //       const savedStudentAssignment = await queryRunner.manager.save(studentAssignment);
      
  //       for (const item of items) {
  //         const studentFeeItem = queryRunner.manager.create(StudentFeeItem, {
  //           tenantId,
  //           studentFeeAssignmentId: savedStudentAssignment.id,
  //           feeStructureItemId: item.id,
  //           amount: item.amount,
  //           isMandatory: item.isMandatory,
  //           isActive: item.isMandatory,
  //         });
      
  //         await queryRunner.manager.save(studentFeeItem);
  //       }
      
  //       fa.studentsAssignedCount = (fa.studentsAssignedCount ?? 0) + 1;
  //       await queryRunner.manager.save(fa);
  //     }
            



  //     const membership = queryRunner.manager.create(UserTenantMembership, {
  //       userId: savedUser.id,
  //       tenantId: tenantId,
  //       role: MembershipRole.STUDENT,
  //       joinedAt: new Date(),
  //     });

  //     await queryRunner.manager.save(membership);

  //     await queryRunner.commitTransaction();

  //     this.logger.log(
  //       `Student created successfully with ID: ${savedStudent.id}`,
  //     );

  //     return {
  //       user: savedUser,
  //       student: savedStudent,
  //       generatedPassword: generatedPassword,
  //     };
  //   } catch (error) {
  //     await queryRunner.rollbackTransaction();
  //     this.logger.error(`Error creating student: ${error.message}`);
  //     throw error;
  //   } finally {
  //     await queryRunner.release();
  //   }
  // }


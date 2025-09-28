import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { FeeAssignment } from './entities/fee-assignment.entity';
import { StudentFeeAssignment } from './entities/student_fee_assignments.entity';
import { StudentFeeItem } from './entities/student_fee_items.entity';
import { FeeStructureItem } from '../fee-structure-item/entities/fee-structure-item.entity';
import { Student } from 'src/admin/student/entities/student.entity';
import { CreateFeeAssignmentInput } from './dtos/assignment-structure.input';
import { UpdateFeeAssignmentInput } from './dtos/update-fee-assignment.input';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { User } from 'src/admin/users/entities/user.entity';
import { FeeStructure } from '../fee-structure/entities/fee-structure.entity';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';
import { BulkToggleStudentFeeItemsInput } from './dtos/bulk-toggle-student-fee-items.input';
import { FeeAssignmentWithStudents, GetFeeAssignmentsByGradeLevelsInput, TenantFeeAssignmentSummary } from './dtos/fee-summary.dto';
import { FeeAssignmentGradeLevel } from './entities/fee_assignment_grade_levels.entity';

@Injectable()
export class FeeAssignmentService {
  constructor(
    @InjectRepository(FeeAssignment)
    private readonly feeAssignmentRepo: Repository<FeeAssignment>,
    
    @InjectRepository(StudentFeeAssignment)
    private readonly studentFeeAssignmentRepo: Repository<StudentFeeAssignment>,
    
    @InjectRepository(StudentFeeItem)
    private readonly studentFeeItemRepo: Repository<StudentFeeItem>,
    
    @InjectRepository(FeeStructureItem)
    private readonly feeStructureItemRepo: Repository<FeeStructureItem>,
    
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,

        private readonly dataSource: DataSource,
    


  ) {}

  
  async create(
    createFeeAssignmentInput: CreateFeeAssignmentInput,
    user: ActiveUserData
  ): Promise<FeeAssignment> {
    const { feeStructureId, tenantGradeLevelIds, description } = createFeeAssignmentInput;
    const tenantId = user.tenantId;
  
    const feeStructure = await this.dataSource.getRepository(FeeStructure).findOne({
      where: { id: feeStructureId, tenantId }
    });
    if (!feeStructure) {
      throw new BadRequestException(`Fee structure with id ${feeStructureId} not found for this tenant`);
    }
  
    const assignedByUserData = await this.dataSource.getRepository(User).findOne({
      where: { id: user.sub },
      select: ['id', 'name'],
    });
    if (!assignedByUserData) {
      throw new BadRequestException(`User with id ${user.sub} not found`);
    }
  
    console.log('=== DEBUGGING TENANT GRADE LEVEL QUERY ===');
    console.log('Target Tenant ID:', tenantId);
    console.log('Target Tenant Grade Level IDs:', tenantGradeLevelIds);
  
    const validTenantGradeLevels = await this.dataSource
      .getRepository(TenantGradeLevel)
      .createQueryBuilder('tgl')
      .innerJoin('tgl.tenant', 'tenant')
      .leftJoinAndSelect('tgl.gradeLevel', 'gradeLevel') 
      .where('tenant.id = :tenantId', { tenantId })
      .andWhere('tgl.id IN (:...tenantGradeLevelIds)', { tenantGradeLevelIds })
      .andWhere('tgl.isActive = true')
      .getMany();
  
    if (validTenantGradeLevels.length !== tenantGradeLevelIds.length) {
      const foundIds = validTenantGradeLevels.map(tgl => tgl.id);
      const missingIds = tenantGradeLevelIds.filter(id => !foundIds.includes(id));
      throw new BadRequestException(
        `Some tenant grade levels do not belong to this tenant or are inactive. Missing IDs: ${missingIds.join(', ')}`
      );
    }
  
    const actualGradeLevelIds = validTenantGradeLevels.map(tgl => tgl.gradeLevel.id);
    
    console.log('Valid tenant grade levels found:', validTenantGradeLevels.length);
    console.log('Extracted grade level IDs for students:', actualGradeLevelIds);
  
    const existingAssignment = await this.dataSource
    .getRepository(FeeAssignmentGradeLevel)
    .createQueryBuilder('fagl')
    .innerJoin('fagl.feeAssignment', 'fa')
    .where('fa.tenantId = :tenantId', { tenantId })
    .andWhere('fa.feeStructureId = :feeStructureId', { feeStructureId })
    .andWhere('fagl.tenantGradeLevelId IN (:...tenantGradeLevelIds)', { tenantGradeLevelIds })
    .andWhere('fa.isActive = true')
    .getOne();
  
  if (existingAssignment) {
    throw new ConflictException(
      `Fee structure already assigned to one or more of these grade levels`
    );
  }
    const feeAssignment = this.feeAssignmentRepo.create({
      tenantId,
      feeStructureId,
      assignedBy: assignedByUserData.id,
      description,
    });
    const savedFeeAssignment = await this.feeAssignmentRepo.save(feeAssignment);
  
    const feeAssignmentGradeLevels = tenantGradeLevelIds.map(tenantGradeLevelId => 
      this.dataSource.getRepository(FeeAssignmentGradeLevel).create({
        feeAssignmentId: savedFeeAssignment.id,
        tenantGradeLevelId,
      })
    );
    await this.dataSource.getRepository(FeeAssignmentGradeLevel).save(feeAssignmentGradeLevels);
  
    const students = await this.studentRepo.find({
      where: {
        tenant_id: tenantId,
        grade: In(tenantGradeLevelIds),
        isActive: true,
      },
    });
  
    console.log(students, 'students found for assignment...');
    console.log('Students found:', students.length);
  
    let studentsAssigned = 0;
  
    if (students.length > 0) {
      const items = await this.feeStructureItemRepo.find({
        where: { tenantId, feeStructureId },
      });
      if (items.length === 0) {
        throw new BadRequestException('No fee structure items found for the specified fee structure');
      }
  
      for (const student of students) {
        const studentAssignment = this.studentFeeAssignmentRepo.create({
          tenantId,
          studentId: student.id,
          feeAssignmentId: savedFeeAssignment.id,
        });
  
        const savedStudentAssignment = await this.studentFeeAssignmentRepo.save(studentAssignment);
  
        for (const item of items) {
          const studentFeeItem = this.studentFeeItemRepo.create({
            tenantId,
            studentFeeAssignmentId: savedStudentAssignment.id,
            feeStructureItemId: item.id,
            amount: item.amount,
            isMandatory: item.isMandatory,
            isActive: true, 
          });
  
          await this.studentFeeItemRepo.save(studentFeeItem);
        }
        studentsAssigned++;
      }
    }
  
    savedFeeAssignment.studentsAssignedCount = studentsAssigned;
    await this.feeAssignmentRepo.save(savedFeeAssignment);
  
    console.log('Successfully assigned fees to', studentsAssigned, 'students');
  
    const finalFeeAssignment = await this.feeAssignmentRepo.findOne({
      where: { id: savedFeeAssignment.id },
      relations: ['assignedByUser', 'feeStructure', 'gradeLevels', 'gradeLevels.tenantGradeLevel'],
    });
  
    if (!finalFeeAssignment) {
      throw new Error('Fee assignment not found after creation');
    }
  
    return finalFeeAssignment;
  }






  

  // async create(
  //   createFeeAssignmentInput: CreateFeeAssignmentInput,
  //   user: ActiveUserData
  // ): Promise<FeeAssignment> {
  //   const { feeStructureId, gradeLevelIds, description } = createFeeAssignmentInput;
    
  //   const tenantId = user.tenantId;
  
  //   const feeStructure = await this.dataSource.getRepository(FeeStructure).findOne({
  //     where: { id: feeStructureId, tenantId }
  //   });
    
  //   if (!feeStructure) {
  //     throw new BadRequestException(`Fee structure with id ${feeStructureId} not found`);
  //   }
  
  //   const assignedByUserData = await this.dataSource.getRepository(User).findOne({
  //     where: { id: user.sub },
  //     select: ['id', 'name'],
  //   });

  //   console.log(assignedByUserData, 'assignedByUserData');
    
  //   if (!assignedByUserData) {
  //     throw new BadRequestException(`User with id ${user.sub} not found`);
  //   }
    
  //   const feeAssignment = this.feeAssignmentRepo.create({
  //     tenantId,
  //     feeStructureId,
  //     gradeLevelIds,
  //     assignedBy: assignedByUserData.id, 
  //     description,
  //   });
    
  
  //   const savedFeeAssignment = await this.feeAssignmentRepo.save(feeAssignment);
  
  //   const students = await this.studentRepo.find({
  //     where: { 
  //       tenant_id: tenantId, 
  //       grade: { id: In(gradeLevelIds) },
  //       isActive: true 
  //     },
  //   });
  
  //   if (students.length === 0) {
  //     throw new BadRequestException('No active students found for the specified grade levels');
  //   }
  
  //   const items = await this.feeStructureItemRepo.find({
  //     where: { tenantId, feeStructureId },
  //   });
  
  //   if (items.length === 0) {
  //     throw new BadRequestException('No fee structure items found for the specified fee structure');
  //   }
  
  //   for (const student of students) {
  //     const studentAssignment = this.studentFeeAssignmentRepo.create({
  //       tenantId,
  //       studentId: student.id,
  //       feeAssignmentId: savedFeeAssignment.id,
  //     });
  
  //     const savedStudentAssignment = await this.studentFeeAssignmentRepo.save(studentAssignment);
  
  //     for (const item of items) {
  //       const studentFeeItem = this.studentFeeItemRepo.create({
  //         tenantId,
  //         studentFeeAssignmentId: savedStudentAssignment.id,
  //         feeStructureItemId: item.id,
  //         amount: item.amount,
  //         isMandatory: item.isMandatory,
  //         isActive: item.isMandatory, 
  //       });
  
  //       await this.studentFeeItemRepo.save(studentFeeItem);
  //     }
  //   }
  
  //   return this.feeAssignmentRepo.findOne({
  //     where: { id: savedFeeAssignment.id },
  //     relations: ['assignedByUser', 'feeStructure'],
  //   }).then((feeAssignment) => {
  //     if (!feeAssignment) {
  //       throw new Error('Fee assignment not found');
  //     }
  //     return feeAssignment;
  //   });
  // }
  

  // async create(createFeeAssignmentInput: CreateFeeAssignmentInput, user: ActiveUserData): Promise<FeeAssignment> {
  //   const { feeStructureId, gradeLevelIds } = createFeeAssignmentInput;

  //   const tenantId = user.tenantId;

  //   const assignedByUser = this.dataSource.getRepository(User);

  //   const assignedByUserData = await assignedByUser.findOne({
  //     where: { id: user.sub },
  //     select: ['id', 'name'],
  //   });
    
  //   console.log(assignedByUserData?.name, 'fjkdjfkdjfkjdkfjkdfj,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,');

    

  //   const feeAssignment = this.feeAssignmentRepo.create({
  //     tenantId,
  //     feeStructureId,
  //     gradeLevelIds,
  //     assignedBy: assignedByUserData?.id,
  //     description: createFeeAssignmentInput.description, 
  //   });

    

  //   const savedFeeAssignment = await this.feeAssignmentRepo.save(feeAssignment);

  //   const students = await this.studentRepo.find({
  //     where: { 
  //       tenant_id: tenantId, 
  //       grade: { id: In(gradeLevelIds) },
  //       isActive: true 
  //     },
  //   });

  //   if (students.length === 0) {
  //     throw new BadRequestException('No active students found for the specified grade levels');
  //   }

  //   const items = await this.feeStructureItemRepo.find({
  //     where: { tenantId, feeStructureId },
  //   });

  //   if (items.length === 0) {
  //     throw new BadRequestException('No fee structure items found for the specified fee structure');
  //   }

  //   for (const student of students) {
  //     const studentAssignment = this.studentFeeAssignmentRepo.create({
  //       tenantId,
  //       studentId: student.id,
  //       feeAssignmentId: savedFeeAssignment.id,
  //     });

  //     const savedStudentAssignment = await this.studentFeeAssignmentRepo.save(studentAssignment);

  //     for (const item of items) {
  //       const studentFeeItem = this.studentFeeItemRepo.create({
  //         tenantId,
  //         studentFeeAssignmentId: savedStudentAssignment.id,
  //         feeStructureItemId: item.id,
  //         amount: item.amount,
  //         isMandatory: item.isMandatory,
  //         isActive: item.isMandatory ? true : false,
  //       });

  //       await this.studentFeeItemRepo.save(studentFeeItem);
  //     }
  //   }

  //   return savedFeeAssignment;
  // }

  async findAll(tenantId: string): Promise<FeeAssignment[]> {
    return this.feeAssignmentRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<FeeAssignment> {
    const feeAssignment = await this.feeAssignmentRepo.findOne({
      where: { id, tenantId },
    });

    if (!feeAssignment) {
      throw new NotFoundException(`Fee assignment with ID ${id} not found`);
    }

    return feeAssignment;
  }

  async update(id: string, updateFeeAssignmentInput: UpdateFeeAssignmentInput, tenantId: string): Promise<FeeAssignment> {
    const feeAssignment = await this.findOne(id, tenantId);
    
    Object.assign(feeAssignment, updateFeeAssignmentInput);
    
    return this.feeAssignmentRepo.save(feeAssignment);
  }

  async remove(id: string, tenantId: string): Promise<boolean> {
    const feeAssignment = await this.findOne(id, tenantId);
    
    await this.feeAssignmentRepo.remove(feeAssignment);
    return true;
  }

  async getStudentFeeAssignments(studentId: string, tenantId: string): Promise<StudentFeeAssignment[]> {
    return this.studentFeeAssignmentRepo.find({
      where: { 
        studentId, 
        tenantId,
        isActive: true 
      },
      relations: ['feeItems'],
    });
  }

  async getAssignedStudents(feeAssignmentId: string, tenantId: string): Promise<StudentFeeAssignment[]> {
    return this.studentFeeAssignmentRepo.find({
      where: { 
        feeAssignmentId, 
        tenantId,
        isActive: true 
      },
      relations: ['student', 'feeItems'],
    });
  }


  async toggleStudentFeeItem(studentFeeItemId: string, isActive: boolean, tenantId: string): Promise<StudentFeeItem> {
    const studentFeeItem = await this.studentFeeItemRepo.findOne({
      where: { id: studentFeeItemId, tenantId },
      relations: [
        'studentFeeAssignment',
        'studentFeeAssignment.student',
        'studentFeeAssignment.student.user',
        'feeStructureItem',
        'feeStructureItem.feeBucket',
      ],
    });
  
    if (!studentFeeItem) {
      throw new NotFoundException(`Student fee item with ID ${studentFeeItemId} not found`);
    }
  
    if (studentFeeItem.isMandatory && !isActive) {
      throw new BadRequestException('Cannot deactivate mandatory fee items');
    }
  
    studentFeeItem.isActive = isActive;
    return this.studentFeeItemRepo.save(studentFeeItem);
  }


  // async getStudentFeeItems(studentId: string, tenantId: string): Promise<StudentFeeItem[]> {
  //   return this.studentFeeItemRepo.find({
  //     where: {
  //       tenantId,
  //       studentFeeAssignment: {
  //         studentId,
  //         tenantId,
  //         isActive: true,
  //       },
  //     },
  //     relations: [
  //       'feeStructureItem',
  //       'feeStructureItem.feeBucket',
  //       'studentFeeAssignment',
  //       'studentFeeAssignment.student',
  //       'studentFeeAssignment.student.user',
  //       'studentFeeAssignment.student.grade',
  //       'studentFeeAssignment.student.grade.gradeLevel',
  //       'studentFeeAssignment.feeAssignment',
  //       'studentFeeAssignment.feeAssignment.feeStructure',
  //       'studentFeeAssignment.feeAssignment.feeStructure.academicYear',
  //       'studentFeeAssignment.feeAssignment.feeStructure.term',
  //     ],
  //   });
  // };




  async getStudentFeeItems(studentId: string, tenantId: string): Promise<StudentFeeItem[]> {
    return this.studentFeeItemRepo
      .createQueryBuilder('studentFeeItem')
      .leftJoinAndSelect('studentFeeItem.feeStructureItem', 'feeStructureItem')
      .leftJoinAndSelect('feeStructureItem.feeBucket', 'feeBucket')
      .leftJoinAndSelect('studentFeeItem.studentFeeAssignment', 'studentFeeAssignment')
      .leftJoinAndSelect('studentFeeAssignment.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('student.grade', 'grade')
      .leftJoinAndSelect('grade.gradeLevel', 'gradeLevel')
      .leftJoinAndSelect('studentFeeAssignment.feeAssignment', 'feeAssignment')
      .leftJoinAndSelect('feeAssignment.feeStructure', 'feeStructure')
      .leftJoinAndSelect('feeStructure.academicYear', 'academicYear')
      .leftJoinAndSelect('feeStructure.terms', 'terms')
      .where('studentFeeItem.tenantId = :tenantId', { tenantId })
      .andWhere('studentFeeAssignment.studentId = :studentId', { studentId })
      .andWhere('studentFeeAssignment.tenantId = :tenantId', { tenantId })
      .andWhere('studentFeeAssignment.isActive = :isActive', { isActive: true })
      .getMany();
  };




  async getTenantFeeItems(tenantId: string): Promise<StudentFeeItem[]> {
    return this.studentFeeItemRepo
      .createQueryBuilder('studentFeeItem')
      .leftJoinAndSelect('studentFeeItem.feeStructureItem', 'feeStructureItem')
      .leftJoinAndSelect('feeStructureItem.feeBucket', 'feeBucket')
      .leftJoinAndSelect('studentFeeItem.studentFeeAssignment', 'studentFeeAssignment')
      .leftJoinAndSelect('studentFeeAssignment.student', 'student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('student.grade', 'grade')
      .leftJoinAndSelect('grade.gradeLevel', 'gradeLevel')
      .leftJoinAndSelect('studentFeeAssignment.feeAssignment', 'feeAssignment')
      .leftJoinAndSelect('feeAssignment.feeStructure', 'feeStructure')
      .leftJoinAndSelect('feeStructure.academicYear', 'academicYear')
      .leftJoinAndSelect('feeStructure.terms', 'terms')
      .where('studentFeeItem.tenantId = :tenantId', { tenantId })
      .andWhere('studentFeeAssignment.tenantId = :tenantId', { tenantId })
      .andWhere('studentFeeAssignment.isActive = :isActive', { isActive: true })
      .getMany();
  }
  


  




  async bulkToggleStudentFeeItems(input: BulkToggleStudentFeeItemsInput, tenantId: string): Promise<StudentFeeItem[]> {
    const { studentFeeItemIds, isActive } = input;

    const studentFeeItems = await this.studentFeeItemRepo.find({
      where: { id: In(studentFeeItemIds), tenantId },
      relations: [
        'studentFeeAssignment',
        'studentFeeAssignment.student',
        'studentFeeAssignment.student.user',
        'feeStructureItem',
        'feeStructureItem.feeBucket',
      ],
    });

    if (studentFeeItems.length === 0) {
      throw new NotFoundException('No student fee items found');
    }
    if (!isActive) {
      const mandatoryItems = studentFeeItems.filter(item => item.isMandatory);
      if (mandatoryItems.length > 0) {
        throw new BadRequestException('Cannot deactivate mandatory fee items');
      }
    }
    const updatedItems: StudentFeeItem[] = [];
    for (const item of studentFeeItems) {
      item.isActive = isActive;
      const updatedItem = await this.studentFeeItemRepo.save(item);
      updatedItems.push(updatedItem);
    }

    return updatedItems;
  }

  async bulkToggleByFeeStructureItem(
    feeStructureItemId: string, 
    gradeLevelIds: string[], 
    isActive: boolean, 
    tenantId: string
  ): Promise<StudentFeeItem[]> {
    const studentFeeItems = await this.studentFeeItemRepo.find({
      where: {
        tenantId,
        feeStructureItemId,
        studentFeeAssignment: {
          tenantId,
          student: {
            tenant_id: tenantId,
            grade: {
              id: In(gradeLevelIds)
            }
          }
        }
      },
      relations: ['studentFeeAssignment', 'studentFeeAssignment.student', 'studentFeeAssignment.student.grade']
    });

    if (studentFeeItems.length === 0) {
      throw new NotFoundException('No student fee items found for the specified criteria');
    }

    if (!isActive) {
      const mandatoryItems = studentFeeItems.filter(item => item.isMandatory);
      if (mandatoryItems.length > 0) {
        throw new BadRequestException('Cannot deactivate mandatory fee items');
      }
    }

    const updatedItems: StudentFeeItem[] = [];
    for (const item of studentFeeItems) {
      item.isActive = isActive;
      const updatedItem = await this.studentFeeItemRepo.save(item);
      updatedItems.push(updatedItem);
    }

    return updatedItems;
  }


  async getFeeAssignmentsByGradeLevels(
    input: GetFeeAssignmentsByGradeLevelsInput,
    user: ActiveUserData,
  ): Promise<FeeAssignmentWithStudents[]> {
    const { tenantGradeLevelIds, feeStructureId } = input;
    const tenantId = user.tenantId;
  
    console.log('=== FETCHING FEE ASSIGNMENTS BY GRADE LEVELS ===');
    console.log('Tenant ID:', tenantId);
    console.log('Target Tenant GradeLevel IDs:', tenantGradeLevelIds);
    console.log('Fee Structure Filter:', feeStructureId);
  
    const queryBuilder = this.feeAssignmentRepo
      .createQueryBuilder('fa')
      .innerJoinAndSelect('fa.feeStructure', 'fs')
      .innerJoinAndSelect('fa.assignedByUser', 'abu')
      .innerJoin('fa.gradeLevels', 'fagl')
      .where('fa.tenantId = :tenantId', { tenantId })
      .andWhere('fa.isActive = true')
      .andWhere('fagl.tenantGradeLevelId IN (:...tenantGradeLevelIds)', { tenantGradeLevelIds });
  
    if (feeStructureId) {
      queryBuilder.andWhere('fa.feeStructureId = :feeStructureId', { feeStructureId });
    }
  
    const feeAssignments = await queryBuilder.getMany();
  
    if (!feeAssignments.length) return [];
  
    const assignmentIds = feeAssignments.map(fa => fa.id);
  
    const studentAssignments = await this.studentFeeAssignmentRepo.find({
      where: {
        tenantId,
        feeAssignmentId: In(assignmentIds),
        isActive: true,
      },
      relations: [
        'student',
        'student.grade',           
        'student.grade.gradeLevel',
        'feeItems',
        'feeItems.feeStructureItem',
      ],
    });
  
    const result: FeeAssignmentWithStudents[] = [];
  
    for (const fa of feeAssignments) {
      const students = studentAssignments.filter(
        sa =>
          sa.feeAssignmentId === fa.id &&
          sa.student.grade?.id &&
          tenantGradeLevelIds.includes(sa.student.grade.id),
      );
  
      result.push({
        feeAssignment: fa,
        studentAssignments: students,
        totalStudents: students.length,
      });
    }
  
    console.log(`Found ${result.length} fee assignments with students`);
    
    return result;
  }
  
  // async getFeeAssignmentsByGradeLevels(
  //   input: GetFeeAssignmentsByGradeLevelsInput,
  //   user: ActiveUserData,
  // ): Promise<FeeAssignmentWithStudents[]> {
  //   const { tenantGradeLevelIds, feeStructureId } = input;
  //   const tenantId = user.tenantId;
  
  //   console.log('=== FETCHING FEE ASSIGNMENTS BY GRADE LEVELS ===');
  //   console.log('Tenant ID:', tenantId);
  //   console.log('Target Grade Level IDs:', tenantGradeLevelIds);
  //   console.log('Fee Structure Filter:', feeStructureId);
  
  //   const feeAssignments = await this.feeAssignmentRepo
  //     .createQueryBuilder('fa')
  //     .innerJoinAndSelect('fa.feeStructure', 'fs')
  //     .innerJoinAndSelect('fa.assignedByUser', 'abu')
  //     .where('fa.tenantId = :tenantId', { tenantId })
  //     .andWhere('fa.isActive = true')
  //     .andWhere('fa.tenantGradeLevelIds && :gradeLevelIds::text[]', {
  //       gradeLevelIds: tenantGradeLevelIds,
  //     })
  //     .andWhere(
  //       feeStructureId ? 'fa.feeStructureId = :feeStructureId' : '1=1',
  //       { feeStructureId },
  //     )
  //     .getMany();
  
  //   if (!feeAssignments.length) return [];
  //   const assignmentIds = feeAssignments.map(fa => fa.id);
  
  //   const studentAssignments = await this.studentFeeAssignmentRepo.find({
  //     where: {
  //       tenantId,
  //       feeAssignmentId: In(assignmentIds),
  //       isActive: true,
  //     },
  //     relations: [
  //       'student',
  //       'student.grade',
  //       'student.grade.gradeLevel',
  //       'feeItems',
  //       'feeItems.feeStructureItem',
  //     ],
  //   });
  
  //   const result: FeeAssignmentWithStudents[] = [];
  
  //   for (const fa of feeAssignments) {
  //     const students = studentAssignments.filter(
  //       sa =>
  //         sa.feeAssignmentId === fa.id &&
  //         tenantGradeLevelIds.includes(sa.student.grade?.id),
  //     );
  
  //     result.push({
  //       feeAssignment: fa,
  //       studentAssignments: students,
  //       totalStudents: students.length,
  //     });
  //   }
  
  //   return result;
  // }
  
  async getAllTenantFeeAssignments(user: ActiveUserData): Promise<TenantFeeAssignmentSummary> {
    const tenantId = user.tenantId;
  
    console.log('=== FETCHING ALL TENANT FEE ASSIGNMENTS ===');
    console.log('Tenant ID:', tenantId);
  
    const feeAssignments = await this.feeAssignmentRepo.find({
      where: {
        tenantId,
        isActive: true,
      },
      relations: ['feeStructure', 'assignedByUser'],
      order: {
        createdAt: 'DESC',
      },
    });
  
    console.log('Found fee assignments:', feeAssignments.length);
  
    const feeAssignmentDetails: FeeAssignmentWithStudents[] = [];
    let totalStudentsWithFees = 0;
  
    for (const feeAssignment of feeAssignments) {
      const studentAssignments = await this.studentFeeAssignmentRepo.find({
        where: {
          tenantId,
          feeAssignmentId: feeAssignment.id,
          isActive: true,
        },
        relations: [
          'student',
          'student.grade',
          'student.user',
          'student.grade.gradeLevel',
          'feeItems',
          'feeItems.feeStructureItem',
        ],
      });
  
      console.log(`Fee Assignment ${feeAssignment.id}: ${studentAssignments.length} students`);
  
      feeAssignmentDetails.push({
        feeAssignment,
        studentAssignments,
        totalStudents: studentAssignments.length,
      });
  
      totalStudentsWithFees += studentAssignments.length;
    }
  
    return {
      tenantId,
      feeAssignments: feeAssignmentDetails,
      totalFeeAssignments: feeAssignments.length,
      totalStudentsWithFees,
    };
  }
  


  async getFeeAssignmentById(
    feeAssignmentId: string,
    user: ActiveUserData
  ): Promise<FeeAssignmentWithStudents> {
    const tenantId = user.tenantId;
  
    console.log('=== FETCHING FEE ASSIGNMENT BY ID ===');
    console.log('Fee Assignment ID:', feeAssignmentId);
    console.log('Tenant ID:', tenantId);
  
    const feeAssignment = await this.feeAssignmentRepo.findOne({
      where: {
        id: feeAssignmentId,
        tenantId,
        isActive: true,
      },
      relations: ['feeStructure', 'assignedByUser'],
    });
  
    if (!feeAssignment) {
      throw new BadRequestException(`Fee assignment with id ${feeAssignmentId} not found for this tenant`);
    }
  
    const studentAssignments = await this.studentFeeAssignmentRepo.find({
      where: {
        tenantId,
        feeAssignmentId: feeAssignment.id,
        isActive: true,
      },
      relations: [
        'student',
        'student.grade',
        'student.grade.gradeLevel',
        'feeItems',
        'feeItems.feeStructureItem',
      ],
    });
  
    console.log(`Found ${studentAssignments.length} student assignments`);
  
    return {
      feeAssignment,
      studentAssignments,
      totalStudents: studentAssignments.length,
    };
  }

  
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
    const { feeStructureId, gradeLevelIds, description } = createFeeAssignmentInput;
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
  
    // 3. Validate grade levels belong to this tenant
    const tenantGradeLevels = await this.dataSource.getRepository(TenantGradeLevel).find({
      where: {
        tenant: { id: tenantId },
        gradeLevel: { id: In(gradeLevelIds) },
        isActive: true,
      },
      relations: ['gradeLevel'],
    });
  
    if (tenantGradeLevels.length !== gradeLevelIds.length) {
      throw new BadRequestException(
        `One or more grade levels do not belong to this tenant`
      );
    }
  
    // 4. Create fee assignment
    const feeAssignment = this.feeAssignmentRepo.create({
      tenantId,
      feeStructureId,
      gradeLevelIds,
      assignedBy: assignedByUserData.id,
      description,
    });
    const savedFeeAssignment = await this.feeAssignmentRepo.save(feeAssignment);
  
    // 5. Find students in those grade levels
    const students = await this.studentRepo.find({
      where: {
        tenant_id: tenantId,
        grade: { id: In(gradeLevelIds) },
        isActive: true,
      },
    });
  
    if (students.length === 0) {
      throw new BadRequestException('No active students found for the specified grade levels');
    }
  
    // 6. Get fee structure items
    const items = await this.feeStructureItemRepo.find({
      where: { tenantId, feeStructureId },
    });
    if (items.length === 0) {
      throw new BadRequestException('No fee structure items found for the specified fee structure');
    }
  
    // 7. Assign fees to each student
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
          isActive: item.isMandatory,
        });
  
        await this.studentFeeItemRepo.save(studentFeeItem);
      }
    }
  
    // 8. Return final fee assignment with relations
    return this.feeAssignmentRepo.findOne({
      where: { id: savedFeeAssignment.id },
      relations: ['assignedByUser', 'feeStructure'],
    }).then((feeAssignment) => {
      if (!feeAssignment) {
        throw new Error('Fee assignment not found after creation');
      }
      return feeAssignment;
    });
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
}
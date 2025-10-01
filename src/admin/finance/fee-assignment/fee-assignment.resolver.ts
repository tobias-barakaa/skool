import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { FeeAssignment } from './entities/fee-assignment.entity';
import { FeeAssignmentService } from './fee-assignment.service';
import { CreateFeeAssignmentInput } from './dtos/assignment-structure.input';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { UpdateFeeAssignmentInput } from './dtos/update-fee-assignment.input';
import { StudentFeeAssignment } from './entities/student_fee_assignments.entity';
import { StudentFeeItem } from './entities/student_fee_items.entity';
import { BulkToggleByFeeStructureItemInput } from './dtos/bulk-toggle-by-fee-structure-item.input';
import { BulkToggleStudentFeeItemsInput } from './dtos/bulk-toggle-student-fee-items.input';
import { FeeAssignmentWithStudents, GetFeeAssignmentsByGradeLevelsInput, TenantFeeAssignmentSummary } from './dtos/fee-summary.dto';
import GraphQLJSON from 'graphql-type-json';
import { StudentFeeSummary } from './dtos/student-fee-summary.dto';

@Resolver(() => FeeAssignment)
export class FeeAssignmentResolver {
  constructor(private readonly feeAssignmentService: FeeAssignmentService) {}

  @Mutation(() => FeeAssignment, {
    description: 'Create a new fee assignment and assign it to students in specified grade levels'
  })
  async createFeeAssignment(
    @Args('createFeeAssignmentInput') createFeeAssignmentInput: CreateFeeAssignmentInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<FeeAssignment> {
    
    return this.feeAssignmentService.create(createFeeAssignmentInput, user);
  }

  @Query(() => [FeeAssignment], {
    description: 'Get all fee assignments for the current tenant'
  })
  async feeAssignments(
    @ActiveUser() user: ActiveUserData,
  ): Promise<FeeAssignment[]> {
    const tenantId = user.tenantId;
    return this.feeAssignmentService.findAll(tenantId);
  }

  @Query(() => FeeAssignment, {
    description: 'Get a specific fee assignment by ID'
  })
  async feeAssignment(
    @Args('id', { type: () => ID }) id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<FeeAssignment> {
    const tenantId = user.tenantId;
    return this.feeAssignmentService.findOne(id, tenantId);
  }

  @Mutation(() => FeeAssignment, {
    description: 'Update a fee assignment'
  })
  async updateFeeAssignment(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateFeeAssignmentInput') updateFeeAssignmentInput: UpdateFeeAssignmentInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<FeeAssignment> {
    const tenantId = user.tenantId;
    return this.feeAssignmentService.update(id, updateFeeAssignmentInput, tenantId);
  }

  @Mutation(() => Boolean, {
    description: 'Delete a fee assignment and all related student assignments'
  })
  async removeFeeAssignment(
    @Args('id', { type: () => ID }) id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<boolean> {
    const tenantId = user.tenantId;
    return this.feeAssignmentService.remove(id, tenantId);
  }

  @Query(() => [StudentFeeAssignment], {
    description: 'Get all fee assignments for a specific student'
  })
  async studentFeeAssignments(
    @Args('studentId', { type: () => ID }) studentId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<StudentFeeAssignment[]> {
    const tenantId = user.tenantId;
    return this.feeAssignmentService.getStudentFeeAssignments(studentId, tenantId);
  }

  @Query(() => [StudentFeeAssignment], {
    description: 'Get all students assigned to a specific fee assignment'
  })
  async assignedStudents(
    @Args('feeAssignmentId', { type: () => ID }) feeAssignmentId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<StudentFeeAssignment[]> {
    const tenantId = user.tenantId;
    return this.feeAssignmentService.getAssignedStudents(feeAssignmentId, tenantId);
  }

  @Mutation(() => StudentFeeItem, {
    description: 'Activate or deactivate an optional fee item for a student'
  })
  async toggleStudentFeeItem(
    @Args('studentFeeItemId', { type: () => ID }) studentFeeItemId: string,
    @Args('isActive', { type: () => Boolean }) isActive: boolean,
    @ActiveUser() user: ActiveUserData,
  ): Promise<StudentFeeItem> {
    const tenantId = user.tenantId;
    return this.feeAssignmentService.toggleStudentFeeItem(studentFeeItemId, isActive, tenantId);
  }



  // @Mutation(() => StudentFeeItem, {
  //   description: 'Activate or deactivate an optional fee item for a student'
  // })
  // async toggleStudentFeeItem(
  //   @Args('studentFeeItemId', { type: () => ID }) studentFeeItemId: string,
  //   @Args('isActive', { type: () => Boolean }) isActive: boolean,
  //   @ActiveUser() user: ActiveUserData,
  // ): Promise<StudentFeeItem> {
  //   const tenantId = user.tenantId;
  //   return this.feeAssignmentService.toggleStudentFeeItem(studentFeeItemId, isActive, tenantId);
  // }

  @Query(() => [StudentFeeItem], {
    description: 'Get all fee items for a specific student'
  })
  async studentFeeItems(
    @Args('studentId', { type: () => ID }) studentId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<StudentFeeItem[]> {
    const tenantId = user.tenantId;
    return this.feeAssignmentService.getStudentFeeItems(studentId, tenantId);
  }

  @Query(() => StudentFeeSummary, { nullable: true })
async studentFeeSummary(
  @Args('studentId', { type: () => ID }) studentId: string,
  @ActiveUser() user: ActiveUserData,
): Promise<StudentFeeSummary | null> {
  return this.feeAssignmentService.getStudentFeeSummary(studentId, user.tenantId);
}

  @Mutation(() => [StudentFeeItem], {
    description: 'Bulk activate or deactivate multiple student fee items'
  })
  async bulkToggleStudentFeeItems(
    @Args('bulkToggleInput') bulkToggleInput: BulkToggleStudentFeeItemsInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<StudentFeeItem[]> {
    const tenantId = user.tenantId;
    return this.feeAssignmentService.bulkToggleStudentFeeItems(bulkToggleInput, tenantId);
  }



  @Query(() => [StudentFeeItem], {
    description: 'Get all fee items for a tenant'
  })
  async tenantFeeItems(
    @ActiveUser() user: ActiveUserData,
  ): Promise<StudentFeeItem[]> {
    const tenantId = user.tenantId;
    return this.feeAssignmentService.getTenantFeeItems(tenantId);
  }
  

  @Mutation(() => [StudentFeeItem], {
    description: 'Bulk toggle fee items by fee structure item and grade levels (e.g., activate transport for all Grade 1 students)'
  })
  async bulkToggleByFeeStructureItem(
    @Args('bulkToggleByFeeStructureItemInput') input: BulkToggleByFeeStructureItemInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<StudentFeeItem[]> {
    const tenantId = user.tenantId;
    const { feeStructureItemId, gradeLevelIds, isActive } = input;
    return this.feeAssignmentService.bulkToggleByFeeStructureItem(
      feeStructureItemId,
      gradeLevelIds,
      isActive,
      tenantId
    );
  }





  @Query(() => [FeeAssignmentWithStudents], {
    description: 'Get fee assignments for specific tenant grade levels with all student details and fee items'
  })
  async getFeeAssignmentsByGradeLevels(
    @Args('input') input: GetFeeAssignmentsByGradeLevelsInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<FeeAssignmentWithStudents[]> {
    return this.feeAssignmentService.getFeeAssignmentsByGradeLevels(input, user);
  }
  
  @Query(() => TenantFeeAssignmentSummary, {
    description: 'Get all fee assignments for the current tenant with complete student and grade level data'
  })
  async getAllTenantFeeAssignments(
    @ActiveUser() user: ActiveUserData,
  ): Promise<TenantFeeAssignmentSummary> {
    return this.feeAssignmentService.getAllTenantFeeAssignments(user);
  }
  
  @Query(() => FeeAssignmentWithStudents, {
    description: 'Get a specific fee assignment by ID with all student details'
  })
  async getFeeAssignmentById(
    @Args('feeAssignmentId', { type: () => ID }) feeAssignmentId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<FeeAssignmentWithStudents> {
    return this.feeAssignmentService.getFeeAssignmentById(feeAssignmentId, user);
  }
  
  // Additional utility query to get fee assignment statistics
//   @Query(() => GraphQLJSON, {
//     description: 'Get statistical summary of fee assignments for the tenant'
//   })
//   async getFeeAssignmentStatistics(
//     @ActiveUser() user: ActiveUserData,
//   ): Promise<any> {
//     const tenantId = user.tenantId;
  
//     const totalFeeAssignments = await this.feeAssignmentService.feeAssignmentRepo.count({
//       where: { tenantId, isActive: true }
//     });
  
//     const totalStudentAssignments = await this.feeAssignmentService.studentFeeAssignmentRepo.count({
//       where: { tenantId, isActive: true }
//     });
  
//     const totalFeeItems = await this.feeAssignmentService.studentFeeItemRepo.count({
//       where: { tenantId, isActive: true }
//     });
  
//     // Get fee assignments grouped by fee structure
//     const feeStructureStats = await this.feeAssignmentService.feeAssignmentRepo
//       .createQueryBuilder('fa')
//       .select('fs.name', 'feeStructureName')
//       .addSelect('COUNT(fa.id)', 'assignmentCount')
//       .addSelect('SUM(fa.studentsAssignedCount)', 'totalStudents')
//       .leftJoin('fa.feeStructure', 'fs')
//       .where('fa.tenantId = :tenantId', { tenantId })
//       .andWhere('fa.isActive = true')
//       .groupBy('fa.feeStructureId')
//       .addGroupBy('fs.name')
//       .getRawMany();
  
//     return {
//       overview: {
//         totalFeeAssignments,
//         totalStudentAssignments,
//         totalFeeItems,
//       },
//       feeStructureBreakdown: feeStructureStats,
//       generatedAt: new Date().toISOString(),
//     };
  

// }

}


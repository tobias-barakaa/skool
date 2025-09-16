import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { FeeAssignment } from './entities/fee-assignment.entity';
import { FeeAssignmentService } from './fee-assignment.service';
import { CreateFeeAssignmentInput } from './dtos/assignment-structure.input';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { UpdateFeeAssignmentInput } from './dtos/update-fee-assignment.input';
import { StudentFeeAssignment } from './entities/student_fee_assignments.entity';
import { StudentFeeItem } from './entities/student_fee_items.entity';

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
}


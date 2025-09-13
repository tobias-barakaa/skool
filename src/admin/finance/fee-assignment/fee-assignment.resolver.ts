import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { FeeAssignment } from './entities/fee-assignment.entity';
import { FeeAssignmentService } from './fee-assignment.service';
import { MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { Roles } from 'src/iam/decorators/roles.decorator';
import { BulkFeeAssignmentInput, CreateFeeAssignmentInput } from './dtos/create-fee-assignment.input';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';

@Resolver(() => FeeAssignment)
export class FeeAssignmentResolver {
  private readonly logger = new Logger(FeeAssignmentResolver.name);

  constructor(private readonly feeAssignmentService: FeeAssignmentService) {}

  @Mutation(() => [FeeAssignment], { 
    description: 'Create fee assignments for a student'
  })
  @Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.SUPER_ADMIN)
  async createFeeAssignment(
    @Args('input') input: CreateFeeAssignmentInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<FeeAssignment[]> {
    this.logger.log(`Creating fee assignment for student ${input.studentId} by user ${user.sub}`);
    return await this.feeAssignmentService.create(input, user);
  }

  @Mutation(() => [FeeAssignment], { 
    description: 'Bulk assign fees to multiple students'
  })
  @Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.SUPER_ADMIN)
  async bulkFeeAssignment(
    @Args('input') input: BulkFeeAssignmentInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<FeeAssignment[]> {
    this.logger.log(`Bulk assigning fees to ${input.studentIds.length} students by user ${user.sub}`);
    return await this.feeAssignmentService.bulkAssign(input, user);
  }

  @Query(() => [FeeAssignment], { 
    description: 'Get fee assignments for a specific student'
  })
  @Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.SUPER_ADMIN, MembershipRole.TEACHER)
  async feeAssignmentsByStudent(
    @Args('studentId', { type: () => ID }) studentId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<FeeAssignment[]> {
    this.logger.log(`Fetching fee assignments for student ${studentId}`);
    return await this.feeAssignmentService.findByStudent(studentId, user);
  }

  @Query(() => [FeeAssignment], { 
    description: 'Get all fee assignments for the current tenant'
  })
  @Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.SUPER_ADMIN)
  async feeAssignments(
    @ActiveUser() user: ActiveUserData,
  ): Promise<FeeAssignment[]> {
    this.logger.log(`Fetching all fee assignments for tenant ${user.tenantId}`);
    return await this.feeAssignmentService.findAll(user);
  }

  @Mutation(() => Boolean, { 
    description: 'Remove a fee assignment'
  })
  @Roles(MembershipRole.SCHOOL_ADMIN)
  async removeFeeAssignment(
    @Args('id', { type: () => ID }) id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<boolean> {
    this.logger.log(`Removing fee assignment ${id} by user ${user.sub}`);
    return await this.feeAssignmentService.remove(id, user);
  }
}
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { FeeStructure } from './entities/fee-structure.entity';
import { FeeStructureService } from './fee-structure.service';
import { MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { Roles } from 'src/iam/decorators/roles.decorator';
import { CreateFeeStructureInput } from './dtos/create-fee-structure.input';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';

@Resolver(() => FeeStructure)
export class FeeStructureResolver {
  private readonly logger = new Logger(FeeStructureResolver.name);

  constructor(private readonly feeStructureService: FeeStructureService) {}

  @Mutation(() => FeeStructure, { 
    description: 'Create a new fee structure with items'
  })
  @Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.SUPER_ADMIN)
  async createFeeStructure(
    @Args('input') input: CreateFeeStructureInput,
    @ActiveUser() user: ActiveUserData,
  ) {
    console.log('DEBUG ActiveUser:::::::::::::::::::::::::::::::', user);
    this.logger.log(`Creating fee structure: ${input.name} by user ${user.sub}`);
    return await this.feeStructureService.create(input, user);
  }

  @Query(() => [FeeStructure], { 
    description: 'Get all fee structures for the current tenant'
  })
  @Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.SUPER_ADMIN, MembershipRole.TEACHER)
  async feeStructures(
    @ActiveUser() user: ActiveUserData,
  ): Promise<FeeStructure[]> {
    this.logger.log(`Fetching fee structures for tenant ${user.tenantId}`);
    return await this.feeStructureService.findAll(user);
  }

  @Query(() => FeeStructure, { 
    description: 'Get a single fee structure by ID'
  })
  @Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.SUPER_ADMIN, MembershipRole.TEACHER)
  async feeStructure(
    @Args('id', { type: () => ID }) id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<FeeStructure> {
    this.logger.log(`Fetching fee structure ${id} by user ${user.sub}`);
    return await this.feeStructureService.findOne(id, user);
  }

  @Query(() => FeeStructure, { 
    nullable: true,
    description: 'Get fee structure by grade level, term, and academic year'
  })
  @Roles(MembershipRole.SCHOOL_ADMIN)
  async feeStructureByGradeAndTerm(
    @Args('gradeLevelId', { type: () => ID }) gradeLevelId: string,
    @Args('termId', { type: () => ID }) termId: string,
    @Args('academicYearId', { type: () => ID }) academicYearId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<FeeStructure | null> {
    this.logger.log(`Fetching fee structure for grade ${gradeLevelId}, term ${termId}, year ${academicYearId}`);
    return await this.feeStructureService.findByGradeAndTerm(gradeLevelId, termId, academicYearId, user);
  }
}


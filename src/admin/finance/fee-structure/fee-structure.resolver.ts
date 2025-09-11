import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { FeeStructure } from './entities/fee-structure.entity';
import { FeeStructureService } from './fee-structure.service';
import { MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { Roles } from 'src/iam/decorators/roles.decorator';
import { CreateFeeStructureInput } from './dtos/create-fee-structure.input';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { UpdateFeeStructureInput } from './dtos/update-fee-structure.input.dto';

@Resolver(() => FeeStructure)
export class FeeStructureResolver {
  private readonly logger = new Logger(FeeStructureResolver.name);

  constructor(private readonly feeStructureService: FeeStructureService) {}

  @Mutation(() => FeeStructure, { 
    description: 'Create a new fee structure (items added separately)'
  })
  @Roles(MembershipRole.SCHOOL_ADMIN)
  async createFeeStructure(
    @Args('input') input: CreateFeeStructureInput,
    @ActiveUser() user: ActiveUserData,
  ) {
    this.logger.log(`Creating fee structure: ${input.name} by user ${user.sub}`);
    return await this.feeStructureService.create(input, user);
  }

  @Query(() => [FeeStructure], {
    name: 'feeStructures',
    description: 'Returns every active fee-structure that belongs to the logged-in tenant, with their items, buckets and grade-level details.',
  })
  @Roles(
    MembershipRole.SCHOOL_ADMIN
  )
  async feeStructures(@ActiveUser() user: ActiveUserData): Promise<FeeStructure[]> {
    this.logger.log(`Fetching fee structures for tenant ${user.tenantId}`);
    return this.feeStructureService.findAll(user);
  }

  @Query(() => FeeStructure, { 
    description: 'Get a single fee structure by ID'
  })
  @Roles(MembershipRole.SCHOOL_ADMIN)
  async feeStructure(
    @Args('id', { type: () => ID }) id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<FeeStructure> {
    this.logger.log(`Fetching fee structure ${id} by user ${user.sub}`);
    return await this.feeStructureService.findOne(id, user);
  }

  @Query(() => FeeStructure, {
    nullable: true,
    name: 'feeStructureByGradeAndTerm',
    description:
      'Returns the single active fee-structure that matches the supplied ' +
      'academic-year, term and tenant-grade-level (all scoped to the logged-in tenant). ' +
      'Includes items and their buckets.',
  })
  @Roles(MembershipRole.SCHOOL_ADMIN)
  async feeStructureByGradeAndTerm(
    @Args('tenantGradeLevelId', { type: () => ID }) tenantGradeLevelId: string,
    @Args('termId', { type: () => ID }) termId: string,
    @Args('academicYearId', { type: () => ID }) academicYearId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<FeeStructure | null> {
    this.logger.log(
      `Fetching fee structure for tenant ${user.tenantId} – grade-level ${tenantGradeLevelId}, ` +
      `term ${termId}, year ${academicYearId}`,
    );
    return this.feeStructureService.findByGradeAndTerm(
      tenantGradeLevelId,
      termId,
      academicYearId,
      user,
    );
  }




  @Query(() => FeeStructure, {
    name: 'feeStructure',
    nullable: true,
    description: 'Get a single fee structure by id (tenant scoped)',
  })
  @Roles(MembershipRole.SCHOOL_ADMIN)
  async feeStructureById(
    @Args('id', { type: () => ID }) id: string,
    @ActiveUser() user: ActiveUserData,
  ) {
    return this.feeStructureService.findOneById(id, user);
  }

  
  @Mutation(() => FeeStructure, {
    description: 'Update a fee structure (full item replacement)',
  })
   @Roles(MembershipRole.SCHOOL_ADMIN)
  async updateFeeStructure(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateFeeStructureInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<FeeStructure> {
    return this.feeStructureService.update(id, input, user);
  }


  @Mutation(() => Boolean, {
    description: 'Permanently delete a fee structure (tenant scoped)',
  })
  @Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.SUPER_ADMIN)
  async deleteFeeStructure(
    @Args('id', { type: () => ID }) id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<boolean> {
    return this.feeStructureService.remove(id, user);
  }








}


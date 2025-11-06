import { Resolver, Query, Mutation, Args, ID, Float } from '@nestjs/graphql';
import { UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { FeeStructureItem } from './entities/fee-structure-item.entity';
import { FeeStructureItemService } from './fee-structure-item.service';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { UpdateFeeStructureItemInput } from './dtos/update-fee-structure-item.dto';
import { Roles } from 'src/iam/decorators/roles.decorator';
import { MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';

@Resolver(() => FeeStructureItem)
@Roles(MembershipRole.SCHOOL_ADMIN)
export class FeeStructureItemResolver {
  constructor(private readonly feeStructureItemService: FeeStructureItemService) {}

  private getTenantId(user: ActiveUserData): string {
          if (!user.tenantId) {
            throw new UnauthorizedException('Tenant ID is missing from the active user');
          }
          return user.tenantId;
        }

  // @Mutation(() => FeeStructureItem, { description: 'Create a new fee structure item' })
  // async createFeeStructureItem(
  //   @Args('input') createFeeStructureItemInput: CreateFeeStructureItemInput,
  //   @ActiveUser() user: ActiveUserData,
  // ): Promise<FeeStructureItem> {
  //   const tenantId = user.tenantId;
  //   console.log(tenantId, 'this is the tenant Iddd')
  //   return this.feeStructureItemService.create(tenantId, createFeeStructureItemInput);
  // }

  @Query(() => [FeeStructureItem], { 
    name: 'feeStructureItems',
    description: 'Get all fee structure items for the tenant' 
  })
  async findAll(
    @ActiveUser() user: ActiveUserData
): Promise<FeeStructureItem[]> {
    return this.feeStructureItemService.findAll(this.getTenantId(user));
  }

  @Query(() => FeeStructureItem, { 
    name: 'feeStructureItem',
    description: 'Get a single fee structure item by ID' 
  })
  async findOne(
    @Args('id', { type: () => ID }) id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<FeeStructureItem> {
    return this.feeStructureItemService.findOne(id, this.getTenantId(user));
  }

  @Query(() => [FeeStructureItem], { 
    name: 'feeStructureItemsByStructure',
    description: 'Get all fee structure items for a specific fee structure' 
  })
  async findByStructure(
    @Args('feeStructureId', { type: () => ID }) feeStructureId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<FeeStructureItem[]> {
    return this.feeStructureItemService.findByStructure(feeStructureId, this.getTenantId(user));
  }

  @Query(() => [FeeStructureItem], { 
    name: 'findMandatoryItems',
    description: 'Get all mandatory fee structure items for a specific fee structure' 
  })
  async findMandatoryItems(
    @Args('feeStructureId', { type: () => ID }) feeStructureId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<FeeStructureItem[]> {
    const tenantId = user.tenantId;
    return this.feeStructureItemService.findMandatoryItems(feeStructureId, this.getTenantId(user));
  }

  @Query(() => [FeeStructureItem], { 
    name: 'optionalFeeStructureItems',
    description: 'Get all optional fee structure items for a specific fee structure' 
  })
  async findOptionalItems(
    @Args('feeStructureId', { type: () => ID }) feeStructureId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<FeeStructureItem[]> {
    const tenantId = user.tenantId;
    return this.feeStructureItemService.findOptionalItems(feeStructureId, this.getTenantId(user));
  }

  @Query(() => Float, { 
    name: 'feeStructureTotalAmount',
    description: 'Get the total amount for all items in a fee structure' 
  })
  async getTotalAmount(
    @Args('feeStructureId', { type: () => ID }) feeStructureId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<number> {
    return this.feeStructureItemService.getTotalAmount(feeStructureId, this.getTenantId(user));
  }

  @Query(() => Float, { 
    name: 'feeStructureMandatoryAmount',
    description: 'Get the total amount for all mandatory items in a fee structure' 
  })
  async getMandatoryTotal(
    @Args('feeStructureId', { type: () => ID }) feeStructureId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<number> {
    const tenantId = user.tenantId;
    return this.feeStructureItemService.getMandatoryTotal(feeStructureId, this.getTenantId(user));
  }

  @Mutation(() => Boolean, {
    name: 'deleteFeeStructureItem',
    description:
      'Permanently delete a single fee-structure item (must belong to the logged-in tenant). ' +
      'Returns true when the row was removed, or throws NotFoundException.',
  })
  async deleteFeeStructureItem(
    @Args('id', { type: () => ID }) id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<boolean> {
    return this.feeStructureItemService.remove(id, this.getTenantId(user));
  }

  @Query(() => Float, { 
    name: 'feeStructureOptionalAmount',
    description: 'Get the total amount for all optional items in a fee structure' 
  })
  async getOptionalTotal(
    @Args('feeStructureId', { type: () => ID }) feeStructureId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<number> {
    const tenantId = user.tenantId;
    return this.feeStructureItemService.getOptionalTotal(feeStructureId, this.getTenantId(user));
  }

  // @Mutation(() => FeeStructureItem, { description: 'Update a fee structure item' })
  // async updateFeeStructureItem(
  //   @Args('id', { type: () => ID }) id: string,
  //   @Args('input') updateFeeStructureItemInput: UpdateFeeStructureItemInput,
  //   @ActiveUser() user: ActiveUserData,
  // ): Promise<FeeStructureItem> {
  //   const tenantId = user.tenantId;
  //   return this.feeStructureItemService.update(id, tenantId, updateFeeStructureItemInput);
  // }


  @Mutation(() => FeeStructureItem, {
    name: 'updateFeeStructureItem',
    description:
      'Update a single fee-structure item that belongs to the current tenant. ' +
      'Only the fields supplied in the input are changed; all others are left intact. ' +
      'Returns the fully hydrated item (bucket, structure, academic-year, term, grade-level).',
  })
  async updateFeeStructureItem(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateFeeStructureItemInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<FeeStructureItem> {
    return this.feeStructureItemService.update(id, this.getTenantId(user), input);
  }

  // @Mutation(() => Boolean, { description: 'Delete a fee structure item' })
  // async deleteFeeStructureItem(
  //   @Args('id', { type: () => ID }) id: string,
  //   @ActiveUser() user: ActiveUserData,
  // ): Promise<boolean> {
  //   const tenantId = user.tenantId;
  //   return this.feeStructureItemService.remove(id, tenantId);
  // }

  // @Mutation(() => [FeeStructureItem], { 
  //   description: 'Bulk create fee structure items for a specific fee structure' 
  // })
  // async bulkCreateFeeStructureItems(
  //   @Args('feeStructureId', { type: () => ID }) feeStructureId: string,
  //   @Args('items', { 
  //     type: () => [CreateFeeStructureItemInput],
  //     description: 'Array of fee structure items to create' 
  //   }) items: CreateFeeStructureItemInput[],
  //   @ActiveUser() user: ActiveUserData,
  // ): Promise<FeeStructureItem[]> {
  //   const tenantId = user.tenantId;
    
  //   const itemsToCreate = items.map(item => ({
  //     feeBucketId: item.feeBucketId,
  //     amount: item.amount,
  //     isMandatory: item.isMandatory,
  //   }));

  //   return this.feeStructureItemService.bulkCreate(tenantId, feeStructureId, itemsToCreate);
  // }


  @Mutation(() => Float, { 
    description: 'Delete all fee structure items for a specific fee structure and return count' 
  })
  async deleteFeeStructureItemsByStructure(
    @Args('feeStructureId', { type: () => ID }) feeStructureId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<number> {
    const tenantId = user.tenantId;
    return this.feeStructureItemService.removeByStructure(feeStructureId, this.getTenantId(user));
  }

  
}


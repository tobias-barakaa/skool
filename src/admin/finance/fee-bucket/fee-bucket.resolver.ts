import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { FeeBucket } from './entities/fee-bucket.entity';
import { FeeBucketService } from './fee-bucket.service';
import { MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { Roles } from 'src/iam/decorators/roles.decorator';
import { CreateFeeBucketInput, UpdateFeeBucketInput } from './dtos/create-fee-bucket.input';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';

@Resolver(() => FeeBucket)
export class FeeBucketResolver {
  private readonly logger = new Logger(FeeBucketResolver.name);

  constructor(private readonly feeBucketService: FeeBucketService) {}

  @Mutation(() => FeeBucket, { 
    description: 'Create a new fee bucket'
  })
  @Roles(MembershipRole.SCHOOL_ADMIN)
  async createFeeBucket(
    @Args('input') input: CreateFeeBucketInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<FeeBucket> {
    this.logger.log(`Creating fee bucket: ${input.name} by user ${user.sub}`);
    return await this.feeBucketService.create(input, user);
  }

  @Query(() => [FeeBucket], { 
    description: 'Get all fee buckets for the current tenant'
  })
  @Roles(MembershipRole.SCHOOL_ADMIN)
  async feeBuckets(
    @ActiveUser() user: ActiveUserData,
  ): Promise<FeeBucket[]> {
    this.logger.log(`Fetching fee buckets for tenant ${user.tenantId}`);
    return await this.feeBucketService.findAll(user);
  }

  @Query(() => FeeBucket, { 
    description: 'Get a single fee bucket by ID'
  })
  @Roles(MembershipRole.SCHOOL_ADMIN)
  async feeBucket(
    @Args('id', { type: () => ID }) id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<FeeBucket> {
    this.logger.log(`Fetching fee bucket ${id} by user ${user.sub}`);
    return await this.feeBucketService.findOne(id, user);
  }

  @Mutation(() => FeeBucket, { 
    description: 'Update an existing fee bucket'
  })
  @Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.SUPER_ADMIN)
  async updateFeeBucket(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateFeeBucketInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<FeeBucket> {
    this.logger.log(`Updating fee bucket ${id} by user ${user.sub}`);
    return await this.feeBucketService.update(id, input, user);
  }

  @Mutation(() => Boolean, { 
    description: 'Delete a fee bucket'
  })
  @Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.SUPER_ADMIN)
  async deleteFeeBucket(
    @Args('id', { type: () => ID }) id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<boolean> {
    this.logger.log(`Deleting fee bucket ${id} by user ${user.sub}`);
    return await this.feeBucketService.remove(id, user);
  }
}
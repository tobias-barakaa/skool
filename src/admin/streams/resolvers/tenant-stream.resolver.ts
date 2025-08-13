import { Logger } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { TenantStream } from 'src/admin/school-type/entities/tenant-stream';
import { CreateTenantStreamService } from '../providers/services/create-tenant-stream.service';
import { CreateTenantStreamInput } from '../dtos/create-stream.input';
import { UpdateTenantStreamInput } from '../dtos/update-stream.input';
import { Roles } from 'src/iam/decorators/roles.decorator';
import { MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';

@Resolver(() => TenantStream)
export class TenantStreamResolver {
  private readonly logger = new Logger(TenantStreamResolver.name);

  constructor(
    private readonly createTenantStreamService: CreateTenantStreamService,
  ) {}

  @Mutation(() => TenantStream)
  async createTenantStreamFromScratch(
    @Args('input') input: CreateTenantStreamInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TenantStream> {
    return this.createTenantStreamService.createTenantStreamFromScratch(
      input,
      user,
    );
  }

  @Mutation(() => TenantStream)
  async updateTenantStream(
    @Args('tenantStreamId') id: string,
    @Args('input') input: UpdateTenantStreamInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TenantStream> {
    return this.createTenantStreamService.updateTenantStream(id, user, input);
  }

  @Mutation(() => Boolean)
  async toggleTenantStream(
    @Args('tenantStreamId') id: string,
    @Args('activate') activate: boolean,
    @ActiveUser() user: ActiveUserData,
  ): Promise<boolean> {
    return this.createTenantStreamService.toggleActive(id, user, activate);
  }

  @Roles(
    MembershipRole.TEACHER,
    MembershipRole.SUPER_ADMIN,
    MembershipRole.SCHOOL_ADMIN,
  )
  @Query(() => [TenantStream])
  async tenantStreams(
    @ActiveUser() user: ActiveUserData,
  ): Promise<TenantStream[]> {
    return this.createTenantStreamService.findAllByTenant(user.tenantId);
  }

  @Mutation(() => Boolean)
  async deleteTenantStream(
    @Args('tenantStreamId') tenantStreamId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<boolean> {
    return await this.createTenantStreamService.deleteTenantStream(
      tenantStreamId,
      user.tenantId,
    );
  }

  @Query(() => [TenantStream])
  async getTenantStreams(
    @ActiveUser() user: ActiveUserData,
    @Args('tenantGradeLevelId', { nullable: true }) tenantGradeLevelId?: string,
  ): Promise<TenantStream[]> {
    return await this.createTenantStreamService.getTenantStreams(
      user.tenantId,
      tenantGradeLevelId,
    );
  }
}

import { Logger } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { TenantStream } from 'src/admin/school-type/entities/tenant-stream';
import { CreateTenantStreamService } from '../providers/services/create-tenant-stream.service';

@Resolver(() => TenantStream)
export class TenantStreamResolver {
  private readonly logger = new Logger(TenantStreamResolver.name);

  constructor(
    private readonly createTenantStreamService: CreateTenantStreamService,
  ) {}

  @Mutation(() => TenantStream)
  async createTenantStream(
    @Args('tenantGradeLevelId') tenantGradeLevelId: string,
    @Args('streamId') streamId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TenantStream> {
    return await this.createTenantStreamService.createTenantStream({
      tenantId: user.tenantId,
      tenantGradeLevelId,
      streamId,
    });
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

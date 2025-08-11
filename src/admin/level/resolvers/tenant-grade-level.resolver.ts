import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { TenantGradeLevel } from 'src/admin/school-type/entities/tenant-grade-level';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { CreateTenantGradeLevelService } from '../providers/services/create-tenant-grade-level.service';

@Resolver(() => TenantGradeLevel)
export class TenantGradeLevelResolver {
  private readonly logger = new Logger(TenantGradeLevelResolver.name);

  constructor(
    private readonly createTenantGradeLevelService: CreateTenantGradeLevelService,
  ) {}

  @Mutation(() => TenantGradeLevel)
  async createTenantGradeLevel(
    @Args('curriculumId') curriculumId: string,
    @Args('gradeLevelId') gradeLevelId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TenantGradeLevel> {
    return await this.createTenantGradeLevelService.createTenantGradeLevel({
      tenantId: user.tenantId,
      curriculumId,
      gradeLevelId,
    });
  }

  @Mutation(() => Boolean)
  async deleteTenantGradeLevel(
    @Args('tenantGradeLevelId') tenantGradeLevelId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<boolean> {
    return await this.createTenantGradeLevelService.deleteTenantGradeLevel(
      tenantGradeLevelId,
      user.tenantId,
    );
  }

  @Query(() => [TenantGradeLevel])
  async getTenantGradeLevels(
    @ActiveUser() user: ActiveUserData,
    @Args('curriculumId', { nullable: true }) curriculumId?: string,
  ): Promise<TenantGradeLevel[]> {
    return await this.createTenantGradeLevelService.getTenantGradeLevels(
      user.tenantId,
      curriculumId,
    );
  }

  @Query(() => TenantGradeLevel, { nullable: true })
  async getTenantGradeLevelById(
    @Args('tenantGradeLevelId') tenantGradeLevelId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TenantGradeLevel | null> {
    return await this.createTenantGradeLevelService.getTenantGradeLevelById(
      tenantGradeLevelId,
      user.tenantId,
    );
  }

  @Query(() => [TenantGradeLevel])
  async getGradeLevelsWithTenantStreams(
    @ActiveUser() user: ActiveUserData,
    @Args('curriculumId', { nullable: true }) curriculumId?: string,
  ): Promise<any[]> {
    return await this.createTenantGradeLevelService.getGradeLevelsWithTenantStreams(
      user.tenantId,
      curriculumId,
    );
  }
}

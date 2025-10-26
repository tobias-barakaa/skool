import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import {  Logger } from '@nestjs/common';
import { SchoolConfigService } from '../services/school-config.service';
import { SchoolConfigurationResponse } from '../dtos/config/school-configuration.response';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { Roles } from 'src/iam/decorators/roles.decorator';
import { MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { TenantGradeLevel } from '../entities/tenant-grade-level';
import { SkipSchoolConfigCheck } from 'src/iam/guards/school-setup-guard-service';

@Resolver()
@Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.SUPER_ADMIN)
export class SchoolConfigResolver {
  private readonly logger = new Logger(SchoolConfigResolver.name);

  constructor(private readonly schoolConfigService: SchoolConfigService) {}

  @Mutation(() => SchoolConfigurationResponse)
  @Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.SUPER_ADMIN)
  @SkipSchoolConfigCheck()
  async configureSchoolLevelsByNames(
    @Args('levelNames', { type: () => [String] }) levelNames: string[],
    @ActiveUser() user: ActiveUserData,
  ): Promise<SchoolConfigurationResponse> {
    this.logger.log(
      `GraphQL mutation configureSchoolLevelsByNames called by user ${user.sub}`,
    );

    console.log(user, 'this is userin the header');
    return await this.schoolConfigService.configureSchoolLevelsByNames(
      levelNames,
      user,
    );
  }

  @Query(() => SchoolConfigurationResponse)
  @Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.SUPER_ADMIN)
  async getSchoolConfiguration(
    @ActiveUser() user: ActiveUserData,
  ): Promise<SchoolConfigurationResponse> {
    this.logger.log(
      `GraphQL query getSchoolConfiguration called by user ${user.sub}`,
    );
    return await this.schoolConfigService.getSchoolConfiguration(user);
  }

  @Roles(MembershipRole.SCHOOL_ADMIN, MembershipRole.SUPER_ADMIN, MembershipRole.TEACHER)
  @Query(() => [TenantGradeLevel], { name: 'gradeLevelsForSchoolType' })
  async gradeLevelsForSchoolType(
    @ActiveUser() user: ActiveUserData,
  ): Promise<TenantGradeLevel[]> {
    return this.schoolConfigService.getWholeGradeLevelForSchoolType(
      user.tenantId,
    );
  }
}


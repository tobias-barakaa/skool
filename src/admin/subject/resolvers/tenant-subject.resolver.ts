import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { TenantSubject } from 'src/admin/school-type/entities/tenant-specific-subject';
import { CreateTenantSubjectService } from '../providers/services/create-tenant-subject.service';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { CreateTenantSubjectInput, UpdateTenantSubjectInput } from '../dtos/tenant-subject.input';


@Resolver(() => TenantSubject)
export class TenantSubjectResolver {
  private readonly logger = new Logger(TenantSubjectResolver.name);

  constructor(
    private readonly createTenantSubjectService: CreateTenantSubjectService,
  ) {}


  @Mutation(() => TenantSubject)
  async updateTenantSubject(
    @Args('tenantSubjectId') tenantSubjectId: string,
    @Args('input') input: UpdateTenantSubjectInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TenantSubject> {
    return await this.createTenantSubjectService.updateTenantSubject(
      tenantSubjectId,
      user.tenantId,
      input,
    );
  }

  @Mutation(() => Boolean)
  async deleteTenantSubject(
    @Args('tenantSubjectId') tenantSubjectId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<boolean> {
    return await this.createTenantSubjectService.deleteTenantSubject(
      tenantSubjectId,
      user.tenantId,
    );
  }

  @Query(() => [TenantSubject])
  async getTenantSubjects(
    @ActiveUser() user: ActiveUserData,
    @Args('curriculumId', { nullable: true }) curriculumId?: string,
  ): Promise<TenantSubject[]> {
    return await this.createTenantSubjectService.getTenantSubjects(
      user.tenantId,
      curriculumId,
    );
  }

}

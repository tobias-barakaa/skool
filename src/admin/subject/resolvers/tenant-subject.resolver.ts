import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { TenantSubject } from 'src/admin/school-type/entities/tenant-specific-subject';
import { CreateTenantSubjectService } from '../providers/services/create-tenant-subject.service';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { UpdateTenantSubjectInput } from '../dtos/tenant-subject.input';
import { CreateCustomSubjectInput } from '../dtos/create-custom-subject.input';


@Resolver(() => TenantSubject)
export class TenantSubjectResolver {
  private readonly logger = new Logger(TenantSubjectResolver.name);

  constructor(
    private readonly createTenantSubjectService: CreateTenantSubjectService,
  ) {}

  @Mutation(() => TenantSubject)
  async createCustomSubject(
    @Args('input') input: CreateCustomSubjectInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TenantSubject> {
    return this.createTenantSubjectService.create(input, user);
  }

  @Mutation(() => TenantSubject)
  async updateCustomSubject(
    @Args('tenantSubjectId') id: string,
    @Args('input') input: UpdateTenantSubjectInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<TenantSubject> {
    return this.createTenantSubjectService.update(id, user, input);
  }

  @Mutation(() => Boolean)
  async deleteCustomSubject(
    @Args('tenantSubjectId') id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<boolean> {
    return this.createTenantSubjectService.delete(id, user);
  }

  @Query(() => [TenantSubject])
  async tenantSubjects(@ActiveUser() user: ActiveUserData) {
    return this.createTenantSubjectService.findAllByTenant(user);
  }

  @Mutation(() => Boolean)
  async deactivateTenantSubject(
    @Args('tenantSubjectId') id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<boolean> {
    return this.createTenantSubjectService.deactivate(id, user);
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



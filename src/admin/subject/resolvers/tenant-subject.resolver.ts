import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { TenantSubject } from 'src/admin/school-type/entities/tenant-specific-subject';
import { CreateTenantSubjectService } from '../providers/services/create-tenant-subject.service';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { UpdateTenantSubjectInput } from '../dtos/tenant-subject.input';
import { CreateCustomSubjectInput } from '../dtos/create-custom-subject.input';
import { Roles } from 'src/iam/decorators/roles.decorator';
import { MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { AuthenticationGuard } from 'src/admin/auth/guards/authentication.guard';
import { TenantRoleGuard } from 'src/iam/guards/tenant-role.guard';


@Resolver(() => TenantSubject)
@Roles(MembershipRole.SUPER_ADMIN, MembershipRole.SCHOOL_ADMIN)
export class TenantSubjectResolver {
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

  @Mutation(() => Boolean) async deleteTenantSubject( @Args('tenantSubjectId') id: string, @ActiveUser() user: ActiveUserData, ): Promise<boolean> { return this.createTenantSubjectService.delete(id, user); }

  @Roles(
    MembershipRole.TEACHER,
    MembershipRole.SUPER_ADMIN,
    MembershipRole.SCHOOL_ADMIN,
  )
  @Query(() => [TenantSubject])
  async tenantSubjects(@ActiveUser() user: ActiveUserData) {
    return this.createTenantSubjectService.findAllByTenant(user);
  }

  @Query(() => [TenantSubject])
  async deactivatedTenantSubjects(
    @ActiveUser() user: ActiveUserData,
  ): Promise<TenantSubject[]> {
    return this.createTenantSubjectService.getDeactivatedSubjects(user);
  }

  // Mutation: Activate subject
  @Mutation(() => Boolean)
  async activateTenantSubject(
    @Args('tenantSubjectId') id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<boolean> {
    return this.createTenantSubjectService.activate(id, user);
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


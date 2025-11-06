import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UnauthorizedException } from '@nestjs/common';
import { AcademicYear } from '../entities/academic_years.entity';
import { AcademicYearService } from '../services/academic.service';
import { CreateAcademicYearInput } from '../dtos/create-academic-year.dto';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { UpdateAcademicYearInput } from '../dtos/update-academic-year.dto';
@Resolver(() => AcademicYear)
export class AcademicYearResolver {
  constructor(private readonly service: AcademicYearService) {}

  private getTenantId(user: ActiveUserData): string {
    if (!user.tenantId) {
      throw new UnauthorizedException('Tenant ID is missing from the active user');
    }
    return user.tenantId;
  }

  @Mutation(() => AcademicYear, {
    description: 'Create a new academic year for the tenant'
  })
  @Mutation(() => AcademicYear, { description: 'Creates a new academic year' })
  async createAcademicYear(
    @Args('input', { 
      type: () => CreateAcademicYearInput,
      description: 'Academic year creation input data'
    }) input: CreateAcademicYearInput,
    @ActiveUser() user: ActiveUserData, 
  ): Promise<AcademicYear> {
    const tenantId = this.getTenantId(user);
    const academicYear = await this.service.create(input, tenantId);
    
    return {
      ...academicYear,
      terms: academicYear.terms ?? [], 
    };
  }

  @Query(() => [AcademicYear], {
    description: 'Get all academic years for the current tenant'
  })
  async academicYears(
    @ActiveUser() user: ActiveUserData
  ): Promise<AcademicYear[]> {
    return this.service.findAll(this.getTenantId(user));
  }




  @Mutation(() => AcademicYear, { description: 'Update an academic year' })
async updateAcademicYear(
  @Args('id', { type: () => ID }) id: string,
  @Args('input') input: UpdateAcademicYearInput,
  @ActiveUser() user: ActiveUserData,
): Promise<AcademicYear> {
  return this.service.update(id, input, this.getTenantId(user));
}

@Mutation(() => Boolean, { description: 'Delete an academic year' })
async deleteAcademicYear(
  @Args('id', { type: () => ID }) id: string,
  @ActiveUser() user: ActiveUserData,
): Promise<boolean> {
  return this.service.remove(id, this.getTenantId(user));
}

@Mutation(() => AcademicYear, { description: 'Mark an academic year as the current one' })
async setCurrentAcademicYear(
  @Args('id', { type: () => ID }) id: string,
  @ActiveUser() user: ActiveUserData,
): Promise<AcademicYear> {
  return this.service.setCurrent(id, this.getTenantId(user));
}

  @Query(() => AcademicYear, {
    description: 'Get a specific academic year by ID'
  })
  async academicYear(
    @Args('id', { type: () => ID }) id: string,
    @ActiveUser() user: ActiveUserData
  ): Promise<AcademicYear> {
    return this.service.findById(id, this.getTenantId(user));
  }
}

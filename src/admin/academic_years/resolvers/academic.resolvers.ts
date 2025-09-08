import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { AcademicYear } from '../entities/academic_years.entity';
import { AcademicYearService } from '../services/academic.service';
import { CreateAcademicYearInput } from '../dtos/create-academic-year.dto';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';

@Resolver(() => AcademicYear)
export class AcademicYearResolver {
  constructor(private readonly service: AcademicYearService) {}

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
    const academicYear = await this.service.create(input, user.tenantId);
    
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
    return this.service.findAll(user.tenantId);
  }

  @Query(() => AcademicYear, {
    description: 'Get a specific academic year by ID'
  })
  async academicYear(
    @Args('id', { type: () => ID }) id: string,
    @ActiveUser() user: ActiveUserData
  ): Promise<AcademicYear> {
    return this.service.findById(id, user.tenantId);
  }
}


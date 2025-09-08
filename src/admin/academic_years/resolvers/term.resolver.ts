import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { Term } from '../entities/terms.entity';
import { TermService } from '../services/term.service';
import { CreateTermInput } from '../dtos/create-term-input.dto';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';

@Resolver(() => Term)
export class TermResolver {
  constructor(private readonly service: TermService) {}

  @Mutation(() => Term, {
    description: 'Create a new term within an academic year'
  })
  @Mutation(() => Term, {
    description: 'Create a new term within an academic year'
  })
  async createTerm(
    @Args('input', {
      type: () => CreateTermInput,
      description: 'Term creation input data'
    }) input: CreateTermInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Term> {
    return this.service.create(input, user.tenantId);
  }

  @Query(() => [Term], { name: 'termsByAcademicYear', description: 'Retrieves all terms for a given academic year' })
  async getTermsByAcademicYear(
    @Args('academicYearId', { type: () => ID, description: 'The ID of the academic year to fetch terms for' }) academicYearId: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Term[]> {
    return this.service.findAllByAcademicYear(academicYearId, user.tenantId);
  }

  @Query(() => Term, { name: 'term', description: 'Retrieves a single term by its ID' })
  async getTerm(
    @Args('id', { type: () => ID, description: 'The ID of the term' }) id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<Term> {
    return this.service.findOne(id, user.tenantId);
  }

  @Query(() => [Term], {
    description: 'Get all terms for a specific academic year'
  })
  async termsByAcademicYear(
    @Args('academicYearId', { type: () => ID }) academicYearId: string,
    @ActiveUser() user: ActiveUserData
  ): Promise<Term[]> {
    return this.service.findByAcademicYear(academicYearId, user.tenantId);
  }
}


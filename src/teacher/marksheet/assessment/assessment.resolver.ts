import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { CreateAssessmentInput } from './dto/create-assessment.input';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { AssessmentService } from './providers/assessment.service';
import { Assessment } from './entity/assessment.entity';
import { AssessmentOutput } from './dto/assessment.output';
import { AssessmentFilterInput } from './dto/assessment-filter.input';
import { AssessType } from './enums/assesment-type.enum';

@Resolver(() => Assessment)
export class AssessmentResolver {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Mutation(() => AssessmentOutput)
  async createAssessment(
    @Args('input') input: CreateAssessmentInput,
    @ActiveUser() user: ActiveUserData,
  ): Promise<AssessmentOutput> {
    if (!user.tenantId) {
      throw new Error('User tenant information is missing');
    }
    const assessment = await this.assessmentService.create(
      input,
      user.tenantId,
    );
    return AssessmentOutput.from(assessment);
  }

  @Query(() => [AssessmentOutput])
  async assessments(
    @ActiveUser() user: ActiveUserData,
    @Args('filter', { nullable: true }) filter?: AssessmentFilterInput,
  ): Promise<AssessmentOutput[]> {
    const items = await this.assessmentService.getAllAssessments(
      user.tenantId,
      filter,
    );
    return items.map(AssessmentOutput.from);
  }

  @Mutation(() => Boolean)
  async deleteCA(
    @Args('id') id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<boolean> {
    return this.assessmentService.deleteCA(id, user.tenantId);
  }

  @Mutation(() => Boolean)
  async deleteExam(
    @Args('id') id: string,
    @ActiveUser() user: ActiveUserData,
  ): Promise<boolean> {
    return this.assessmentService.deleteExam(id, user.tenantId);
  }
}

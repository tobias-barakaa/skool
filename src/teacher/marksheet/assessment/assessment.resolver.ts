import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { CreateAssessmentInput } from './dto/create-assessment.input';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { AssessmentService } from './providers/assessment.service';
import { Assessment } from './entity/assessment.entity';
import { AssessmentOutput } from './dto/assessment.output';

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
}

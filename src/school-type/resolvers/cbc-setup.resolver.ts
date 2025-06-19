
import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { Subject } from 'src/subject/entities/subject.entity';
import { AddCBCConfigInput } from '../dtos/add-config.input';
import { SubjectService } from '../services/cbc.service';


@Resolver(() => Subject)
export class SubjectResolver {
  constructor(private readonly subjectService: SubjectService) {}

  @Mutation(() => [Subject])
  async addCBCConfiguration(
    @Args('input') input: AddCBCConfigInput,
    @Context() context: any
  ): Promise<Subject[]> {
    const host = context.req.headers.host;
    const userId = context.req.user?.id || 'system';
    
    return this.subjectService.addCBCConfiguration(input, host, userId);
  }
}


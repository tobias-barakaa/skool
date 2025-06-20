
import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { Subject } from 'src/subject/entities/subject.entity';
import { AddCBCConfigInput } from '../dtos/add-config.input';


@Resolver(() => Subject)
export class SubjectResolver {
  
}


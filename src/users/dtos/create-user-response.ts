import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { School } from '../../school/entities/school.entity';
import { TokensOutput } from './tokens.output';

@ObjectType()
export class CreateUserResponse {
  @Field(() => User)
  user: User;

  @Field(() => School)
  school: School;

  @Field(() => String)
  subdomainUrl: string;

  @Field(() => TokensOutput)
  tokens: TokensOutput;

}
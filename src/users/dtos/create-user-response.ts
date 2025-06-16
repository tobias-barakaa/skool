// src/users/dtos/create-user-response.output.ts
import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { School } from '../../school/entities/school.entity';
import { TokensOutput } from './tokens.output';

@ObjectType()
export class CreateUserResponse {
  @Field(() => User)
  user: User;

  @Field(() => School) // Include the school object in the response
  school: School;

  @Field(() => String) // Add the generated subdomain string
  subdomainUrl: string;

  @Field(() => TokensOutput) // ✅ Use the class directly here
  tokens: TokensOutput;
}
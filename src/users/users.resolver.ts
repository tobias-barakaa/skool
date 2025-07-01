// src/users/users.resolver.ts
import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UsersService } from './providers/users.service';
import { User } from './entities/user.entity';
import { Logger, UseFilters } from '@nestjs/common';
import { GraphQLExceptionsFilter } from 'src/common/filter/graphQLException.filter';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { CreateUserResponse } from './dtos/create-user-response';
import { AuthResponse, SignupInput } from './dtos/signUp-input';

@Resolver(() => User)
@UseFilters(GraphQLExceptionsFilter)
export class UsersResolver {
  private readonly logger = new Logger(UsersResolver.name);

  constructor(private readonly usersService: UsersService) {}

@Mutation(() => CreateUserResponse, { name: 'createUser' })
@Auth(AuthType.None)
async createUser(
  @Args('signupInput') signupInput: SignupInput,
  @Context() context,
): Promise<AuthResponse> {

  console.log('📥 Received SignupInput:', JSON.stringify(signupInput, null, 2));

  if (!signupInput || !signupInput.password) {
    console.log('❌ signupInput is missing or has no password:', signupInput);
    throw new Error('Invalid input passed to resolver');
  }

  // return await this.usersService.createUser(signupInput);
  const { user, tokens, subdomainUrl } = await this.usersService.createUser(signupInput);

  context.res.cookie('access_token', tokens.accessToken, {
    httpOnly: true,
    sameSite: 'None',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 15,
    domain: '.squl.co.ke',
  });

  context.res.cookie('refresh_token', tokens.refreshToken, {
    httpOnly: true,
    sameSite: 'None',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7,
    domain: '.squl.co.ke',
  });

  return {
    user,
    tokens,
    subdomainUrl,
  };
}

  @Query(() => [User], { name: 'users' })
  async findAll(): Promise<User[]> {
    // this.logger.log('Fetching all users');
    return await this.usersService.findAll();
  }



}

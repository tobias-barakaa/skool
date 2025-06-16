// src/users/users.resolver.ts
import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { CreateUserInput } from './dtos/create-user.input';
import { UsersService } from './providers/users.service';
import { User } from './entities/user.entity';
import { Logger, UseFilters } from '@nestjs/common';
import { GraphQLExceptionsFilter } from 'src/common/filter/graphQLException.filter';
import { Auth } from 'src/auth/decorator/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { CreateUserResponse } from './dtos/create-user-response';

@Resolver(() => User)
@UseFilters(GraphQLExceptionsFilter)
export class UsersResolver {
  private readonly logger = new Logger(UsersResolver.name);

  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => CreateUserResponse, { name: 'createUser' })
  @Auth(AuthType.None)
  async createUser(
    @Args('createUserInput') createUserInput: CreateUserInput,
    @Context() context,
  ): Promise<CreateUserResponse> {
    const { user, school, tokens } = await this.usersService.create(createUserInput);
    this.logger.log(`User created successfully with ID: ${user.id} for school: ${school.schoolName}`);
    
    // Set cookies
    context.res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      sameSite: 'Strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 15,
      domain: '.squl.co.ke',
    });
  
    context.res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'Strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7,
      domain: '.squl.co.ke',
    });
    
    const subdomainUrl = `${school.subdomain}.squl.co.ke`;
    this.logger.log('Tokens created:', { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });

    return { 
      user, 
      school, 
      subdomainUrl, 
      tokens: { 
        accessToken: tokens.accessToken, 
        refreshToken: tokens.refreshToken 
      }, 
    };
  }

  @Query(() => [User], { name: 'users' })
  async findAll(): Promise<User[]> {
    this.logger.log('Fetching all users');
    return await this.usersService.findAll();
  }
}
// src/users/users.resolver.ts
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { CreateUserInput } from './dtos/create-user.input';
import { UsersService } from './providers/users.service';
import { User } from './entities/user.entity';
import { Logger, UseFilters } from '@nestjs/common';
import { GraphQLExceptionsFilter } from 'src/common/filter/graphQLException.filter';
import { CreateUserResponse } from './dtos/create-user-response';

@Resolver(() => User)
@UseFilters(GraphQLExceptionsFilter)
export class UsersResolver {
  private readonly logger = new Logger(UsersResolver.name);

  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => CreateUserResponse) // Change the return type here
  async createUser(
    @Args('createUserInput') createUserInput: CreateUserInput,
  ): Promise<CreateUserResponse> { // Adjust the return type here
    const { user, school } = await this.usersService.create(createUserInput);
    this.logger.log(`User created successfully with ID: ${user.id} for school: ${school.schoolName}`);

    // Construct the full URL for redirection
    const subdomainUrl = `${school.subdomain}.zelisline.com`;

    return { user, school, subdomainUrl };
  }

  @Query(() => [User], { name: 'users' })
  async findAll(): Promise<User[]> {
    this.logger.log('Fetching all users');
    return await this.usersService.findAll();
  }
}
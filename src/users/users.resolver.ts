import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { CreateUserInput } from './dtos/create-user.input';
import { UsersService } from './providers/users.service';
import { User } from './entities/user.entity';
import { Logger, UseFilters } from '@nestjs/common';
import { GraphQLExceptionsFilter } from 'src/common/filter/graphQLException.filter';

@Resolver(() => User)
@UseFilters(GraphQLExceptionsFilter)
export class UsersResolver {
  private readonly logger = new Logger(UsersResolver.name);

  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => User) 
  async createUser(
    @Args('createUserInput') createUserInput: CreateUserInput,
  ): Promise<User> { 
    this.logger.log(`Creating user with email: ${createUserInput.email}`);
    
    const { user } = await this.usersService.create(createUserInput);
    this.logger.log(`User created successfully with ID: ${user.id}`);
    return user;
  }

  @Query(() => [User], { name: 'users' })
  async findAll(): Promise<User[]> {
    this.logger.log('Fetching all users');
    return await this.usersService.findAll();
  }
}
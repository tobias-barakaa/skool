import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { CreateUserInput } from './dtos/create-user.input';
import { UsersService } from './providers/users.service';
import { User } from './entities/user.entity';
import { Logger, UseFilters } from '@nestjs/common';
import { GraphQLExceptionsFilter } from 'src/common/filters/gql-exception.filter';

@Resolver(() => User)
@UseFilters(GraphQLExceptionsFilter)  // Optional: can be applied globally
export class UsersResolver {
  private readonly logger = new Logger(UsersResolver.name);

  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => User) 
  async createUser(
    @Args('createUserInput') createUserInput: CreateUserInput,
  ): Promise<User> { 
    this.logger.log(`Creating user with email: ${createUserInput.email}`);
    
    try {
      const { user } = await this.usersService.create(createUserInput);
      this.logger.log(`User created successfully with ID: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`);
      throw error; // Let the filter handle it
    }
  }

  @Query(() => [User], { name: 'users' })
  async findAll(): Promise<User[]> {
    try {
      return await this.usersService.findAll();
    } catch (error) {
      this.logger.error(`Failed to fetch users: ${error.message}`);
      throw error;
    }
  }
}
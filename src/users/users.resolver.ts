import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { CreateUserInput } from './dtos/create-user.input';
import { UsersService } from './providers/users.service';
import { User } from './entities/user.entity';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => User) 
  async createUser(
    @Args('createUserInput') createUserInput: CreateUserInput,
  ): Promise<User> { 
    const { user } = await this.usersService.create(createUserInput);
    return user; 
  }

  @Query(() => [User], { name: 'users' })
  findAll() {
    return this.usersService.findAll();
  }
}
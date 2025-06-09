import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './providers/users.service';
import { User } from './entities/user.entity';
import { UserFiltersInput } from './dtos/user-filters.input';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { CreateUserInput } from './dtos/create-user.input';
import { UpdateUserInput } from './dtos/update-user.input';

@Resolver(() => User)
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  @Query(() => [User])
  async users(
    @Args('filters', { nullable: true }) filters: UserFiltersInput,
    @CurrentUser() user: User,
  ): Promise<User[]> {
    return this.usersService.findAll(filters || {}, user);
  }

  @Query(() => User)
  async user(@Args('id') id: string): Promise<User> {
    return this.usersService.findById(id);
  }

  @Mutation(() => User)
  async createUser(
    @Args('createUserInput') createUserInput: CreateUserInput,
    @CurrentUser() user: User,
  ): Promise<User> {
    return this.usersService.create(createUserInput, user);
  }

  @Mutation(() => User)
  async updateUser(
    @Args('id') id: string,
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
    @CurrentUser() user: User,
  ): Promise<User> {
    return this.usersService.update(id, updateUserInput, user);
  }

  @Mutation(() => Boolean)
  async deleteUser(
    @Args('id') id: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.usersService.delete(id, user);
  }
}

// src/user
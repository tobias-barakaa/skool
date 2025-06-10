import { Resolver, Mutation, Args, Query, Int } from '@nestjs/graphql';
import { Logger, UseFilters, ValidationPipe } from '@nestjs/common';
import { UsersService } from './providers/users.service';
import { User } from './entities/user.entity';
import { SchoolService } from '../school/providers/school.service';
import { UserResponse } from './dtos/user.response';
import { GraphQLBusinessExceptionFilter } from '../common/filters/graphql-exception.filter';
import { CreateUserInput } from './dtos/user-signup.input';

@Resolver(() => User)
@UseFilters(GraphQLBusinessExceptionFilter)
export class UsersResolver {
  private readonly logger = new Logger(UsersResolver.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly schoolService: SchoolService,
  ) {}

  @Mutation(() => UserResponse, {
    description: 'Create a new user account with associated school'
  })
  async createUser(
    @Args('input', new ValidationPipe({ transform: true })) input: CreateUserInput,
  ): Promise<UserResponse> {
    this.logger.log(`Creating user with email: ${input.email}`);

    const { schoolName, email, username, password, userRole } = input;

    // Find or create school
    let school = await this.schoolService.findSchoolByName(schoolName);
    if (!school) {
      this.logger.log(`School '${schoolName}' not found, creating new school`);
      school = await this.schoolService.createSchool(schoolName);
    }

    // Create user
    const user = await this.usersService.create(
      email,
      username,
      password,
      school.id,
      userRole,
    );

    this.logger.log(`User created successfully with ID: ${user.id}`);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      userRole: user.userRole,
      schoolId: user.schoolId,
    };
  }
  @Query(() => [User], { name: 'users', description: 'Retrieves all users' })
  async getUsers(): Promise<User[]> {
    return this.usersService.findAll(); // Assuming you have a findAll method in your UserService
  }

}

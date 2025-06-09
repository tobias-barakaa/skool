// src/user/user.resolver.ts
import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { User } from './entities/user.entity';
import { UserService } from './providers/users.service';
import { CreateUserInput } from './dtos/user-signup.input';
import { SchoolService } from 'src/school/providers/school.service';
import { UserRole } from './enums/user-role.enum';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly schoolService: SchoolService,
  ) {}

  @Mutation(() => User, { description: 'Creates a new user and their associated school.' })
  async createUser(@Args('createUserInput') createUserInput: CreateUserInput): Promise<User> {
    // Destructure fields from input
    const { schoolName, username, email, password, userRole } = createUserInput;

    // Validate schoolName (optional, but recommended)
    if (!schoolName) {
      throw new Error('School name is required');
    }

    // Create a school by passing an object with actual data, NOT the class/type
    const newSchool = await this.schoolService.create({ name: schoolName });

    // Create user with new school's id and other details
    const newUser = await this.userService.create(
      email,
      username,
      password,
      newSchool.id,
      userRole
    );

    // Attach the newly created school entity to user before returning
    newUser.school = newSchool;

    return newUser;
  }
}

import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { AuthService } from './providers/auth.service';
import { AuthResponse } from './dtos/auth-response.dto';
import { SignupInput } from './dtos/signup.input';
import { LoginInput } from './dtos/login.input';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => AuthResponse)
  async signup(@Args('signupInput') signupInput: SignupInput) {
    return this.authService.signup(signupInput);
  }

  @Mutation(() => AuthResponse)
  async login(@Args('loginInput') loginInput: LoginInput) {
    return this.authService.login(loginInput);
  }

  @Mutation(() => Boolean)
  async logout(@Context() context): Promise<boolean> {
    // Implement logout logic (blacklist token, etc.)
    return true;
  }

//   @Mutation(() => User)
//   async me(@CurrentUser() user: User): Promise<User> {
//     return user;
//   }
}
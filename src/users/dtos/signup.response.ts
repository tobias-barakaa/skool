// src/auth/dto/signup.response.ts
import { ObjectType, Field } from '@nestjs/graphql';
import { School } from '../../school/entities/school.entity'; // Include School in response
import { User } from '../entities/user.entity';

@ObjectType()
export class SignupResponse {
  @Field(() => User)
  user: User;

  @Field(() => School)
  school: School; // Show the school created for this user
}
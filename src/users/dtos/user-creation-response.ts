// src/users/dtos/user-creation-response.ts (or similar location)
import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../entities/user.entity'; // Adjust path as needed
import { School } from '../../school/entities/school.entity'; // Adjust path as needed

@ObjectType()
export class UserCreationResponse {
  @Field(() => User)
  user: User;

  @Field(() => School)
  school: School;
}
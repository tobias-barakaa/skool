// src/auth/dto/auth-response.type.ts
import { ObjectType, Field } from '@nestjs/graphql';
import { School } from '../../school/entities/school.entity';
import { User } from 'src/users/entities/user.entity';

@ObjectType()
export class AuthResponse {
  @Field()
  accessToken: string;

  @Field(() => User)
  user: User;

  @Field(() => School)
  school: School; // Include the school profile
}
import { Field, ObjectType } from '@nestjs/graphql';
import { TokenPair } from 'src/admin/users/dtos/signUp-input';
import { User } from 'src/admin/users/entities/user.entity';



@ObjectType()
export class SuperAdminAuthResponse {
  @Field(() => User)
  user: User;

  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;

  @Field()
  role: string; 
}


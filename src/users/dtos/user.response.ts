import { ObjectType, Field, ID } from '@nestjs/graphql';
import { UserRole } from '../enums/user-role.enum';

@ObjectType()
export class UserResponse {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  username: string;

  @Field(() => UserRole)
  userRole: UserRole;

  @Field(() => ID)
  schoolId: string;

}

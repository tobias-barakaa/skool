import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class ChatUser {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  userType: string; // 'STUDENT' | 'TEACHER' | 'PARENT'
}
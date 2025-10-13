import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ChatMessageInput, ChatUser } from './chat-response.dto';

@ObjectType()
export class ChatRoomInput {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  roomType: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [ChatUser])
  participants: ChatUser[];

  @Field(() => ChatMessageInput, { nullable: true })
  lastMessage?: ChatMessageInput;

  @Field({ nullable: true })
  unreadCount?: number;
}

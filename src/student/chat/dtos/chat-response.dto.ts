import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ChatRoomInput } from './chat-room.dto';

@ObjectType()
export class ChatUser {
  @Field(() => ID)
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;

  @Field()
  userType: string; 
}



@ObjectType()
export class ChatMessageInput {
  @Field(() => ID)
  id: string;

  @Field()
  message: string;

  @Field({ nullable: true })
  subject?: string;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field()
  createdAt: Date;

  @Field(() => ChatUser)
  sender: ChatUser;

  @Field(() => ChatRoomInput)
  chatRoom: ChatRoomInput;

  @Field()
  isRead: boolean;
}



@ObjectType()
export class MessagesResponse {
  @Field(() => [ChatMessageInput])
  messages: ChatMessageInput[];

  @Field()
  total: number;

  @Field()
  totalPages: number;

  @Field()
  currentPage: number;

  @Field(() => ChatRoomInput)
  chatRoom: ChatRoomInput;
}

@ObjectType()
export class ChatRoomsResponse {
  @Field(() => [ChatRoomInput])
  chatRooms: ChatRoomInput[];

  @Field()
  total: number;

  @Field()
  totalPages: number;

  @Field()
  currentPage: number;
}

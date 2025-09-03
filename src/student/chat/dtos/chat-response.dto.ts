import { ObjectType, Field, ID } from '@nestjs/graphql';

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
  userType: string; // 'TEACHER' | 'STUDENT'
}

@ObjectType()
export class ChatRoom {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  roomType: string; // 'TEACHER_STUDENT'

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [ChatUser])
  participants: ChatUser[];

  @Field(() => ChatMessage, { nullable: true })
  lastMessage?: ChatMessage;

  @Field({ nullable: true })
  unreadCount?: number;
}

@ObjectType()
export class ChatMessage {
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

  @Field(() => ChatRoom)
  chatRoom: ChatRoom;

  @Field()
  isRead: boolean;
}

@ObjectType()
export class MessagesResponse {
  @Field(() => [ChatMessage])
  messages: ChatMessage[];

  @Field()
  total: number;

  @Field()
  totalPages: number;

  @Field()
  currentPage: number;

  @Field(() => ChatRoom)
  chatRoom: ChatRoom;
}

@ObjectType()
export class ChatRoomsResponse {
  @Field(() => [ChatRoom])
  chatRooms: ChatRoom[];

  @Field()
  total: number;

  @Field()
  totalPages: number;

  @Field()
  currentPage: number;
}
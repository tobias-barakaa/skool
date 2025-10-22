import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ChatUser } from './chat-user.dto';
import { ChatRoomDto } from './chat-room.dto';

@ObjectType()
export class ChatMessageDto {
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

  @Field(() => ChatRoomDto)
  chatRoom: ChatRoomDto;

  @Field()
  isRead: boolean;
}
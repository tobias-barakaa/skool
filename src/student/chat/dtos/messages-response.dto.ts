import { ObjectType, Field } from '@nestjs/graphql';
import { ChatMessageDto } from './chat-message.dto';
import { ChatRoomDto } from './chat-room.dto';

@ObjectType()
export class MessagesResponse {
  @Field(() => [ChatMessageDto])
  messages: ChatMessageDto[];

  @Field()
  total: number;

  @Field()
  totalPages: number;

  @Field()
  currentPage: number;

  @Field(() => ChatRoomDto)
  chatRoom: ChatRoomDto;
}

import { ObjectType, Field } from '@nestjs/graphql';
import { ChatRoomDto } from './chat-room.dto';

@ObjectType()
export class ChatRoomsResponse {
  @Field(() => [ChatRoomDto])
  chatRooms: ChatRoomDto[];

  @Field()
  total: number;

  @Field()
  totalPages: number;

  @Field()
  currentPage: number;
}
// import { ObjectType, Field, ID } from '@nestjs/graphql';
// import { ChatUser } from './chat-user.dto';
// import { ChatMessageDto } from './chat-message.dto';
// // import { ChatMessageDto } from './settings';

// @ObjectType()
// export class ChatRoomDto {
//   @Field(() => ID)
//   id: string;

//   @Field()
//   name: string;

//   @Field()
//   type: string; // 'TEACHER_STUDENT', 'TEACHER_PARENT', etc.

//   @Field()
//   createdAt: Date;

//   @Field()
//   updatedAt: Date;

//   @Field(() => [ChatUser])
//   participants: ChatUser[];

//   @Field(() => ChatMessageDto, { nullable: true })
//   lastMessage?: ChatMessageDto;

//   @Field({ nullable: true })
//   unreadCount?: number;
// }



// // import { ObjectType, Field, ID } from '@nestjs/graphql';
// // import { ChatMessageInput, ChatUser } from './chat-response.dto';

// // @ObjectType()
// // export class ChatRoomInput {
// //   @Field(() => ID)
// //   id: string;

// //   @Field()
// //   name: string;

// //   @Field()
// //   roomType: string;

// //   @Field()
// //   createdAt: Date;

// //   @Field()
// //   updatedAt: Date;

// //   @Field(() => [ChatUser])
// //   participants: ChatUser[];

// //   @Field(() => ChatMessageInput, { nullable: true })
// //   lastMessage?: ChatMessageInput;

// //   @Field({ nullable: true })
// //   unreadCount?: number;
// // }

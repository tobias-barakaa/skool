// import { ObjectType, Field, ID } from '@nestjs/graphql';
// import { CreateChatRoomInput } from 'src/messaging/dtos/send-message.input';

// @ObjectType()
// export class ChatUser {
//   @Field(() => ID)
//   id: string;

//   @Field()
//   firstName: string;

//   @Field()
//   lastName: string;

//   @Field()
//   email: string;

//   @Field()
//   userType: string;
// }



// @ObjectType()
// export class ChatMessageInput {
//   @Field(() => ID)
//   id: string;

//   @Field()
//   message: string;

//   @Field({ nullable: true })
//   subject?: string;

//   @Field({ nullable: true })
//   imageUrl?: string;

//   @Field()
//   createdAt: Date;

//   @Field(() => ChatUser)
//   sender: ChatUser;

//   @Field(() => CreateChatRoomInput)
//   chatRoom: CreateChatRoomInput;

//   @Field()
//   isRead: boolean;
// }



// @ObjectType()
// export class MessagesResponse {
//   @Field(() => [ChatMessageInput])
//   messages: ChatMessageInput[];

//   @Field()
//   total: number;

//   @Field()
//   totalPages: number;

//   @Field()
//   currentPage: number;

//   @Field(() => CreateChatRoomInput)
//   chatRoom: CreateChatRoomInput;
// }

// @ObjectType()
// export class ChatRoomsResponse {
//   @Field(() => [CreateChatRoomInput])
//   chatRooms: CreateChatRoomInput[];

//   @Field()
//   total: number;

//   @Field()
//   totalPages: number;

//   @Field()
//   currentPage: number;
// }



// // @ObjectType()
// // export class ChatUser {
// //   @Field(() => ID)
// //   id: string; // This is user_id

// //   @Field(() => ID, { nullable: true })
// //   studentId?: string; // This is student.id (if user is a student)

// //   @Field(() => ID, { nullable: true })
// //   teacherId?: string; // This is teacher.id (if user is a teacher)

// //   @Field()
// //   firstName: string;

// //   @Field()
// //   lastName: string;

// //   @Field()
// //   email: string;

// //   @Field()
// //   userType: string; // 'STUDENT', 'TEACHER', 'PARENT'
// // }

// import {
//   Resolver,
//   Query,
//   Mutation,
//   Args,
//   Subscription,
//   ID,
// } from '@nestjs/graphql';
// import { PubSub } from 'graphql-subscriptions';
// import { StudentChatService } from './chat.service';
// import {
//   ChatMessageInput,
//   ChatRoomsResponse,
//   MessagesResponse,
// } from './dtos/chat-response.dto';
// import { GetChatRoomsArgs } from './dtos/get-chat-rooms.args';
// import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
// import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
// import { GetMessagesArgs } from './dtos/get-messages.args';
// import { SendMessageToTeacherInput } from './dtos/send-message.input';
// import { ChatMessage } from 'src/messaging/entities/chat-message.entity';

// const pubSub = new PubSub();

// @Resolver(() => ChatMessageInput)
// export class StudentChatResolver {
//   constructor(private readonly chatService: StudentChatService) {}

//   /**
//    * Get all chat rooms for the current student
//    */
//   @Query(() => ChatRoomsResponse, {
//     description: 'Get all chat rooms for the current student',
//   })
//   async getMyChatRooms(
//     @Args() args: GetChatRoomsArgs,
//     @ActiveUser() currentUser: ActiveUserData,
//   ): Promise<ChatRoomsResponse> {
//     try {
//       // currentUser.sub is the user_id
//       return await this.chatService.getStudentChatRooms(
//         currentUser.sub,
//         currentUser.tenantId,
//         args,
//       );
//     } catch (error) {
//       console.error('Error in getMyChatRooms resolver:', error);
//       throw error;
//     }
//   }

  
//   @Query(() => MessagesResponse, {
//     description: 'Get messages from a specific chat room',
//   })
//   async getChatMessages(
//     @Args() args: GetMessagesArgs,
//     @ActiveUser() currentUser: ActiveUserData,
//   ): Promise<MessagesResponse> {
//     try {
//       console.log('Getting messages for student:', {
//         studentId: currentUser.sub,
//         tenantId: currentUser.tenantId,
//         args,
//       });

//       return await this.chatService.getMessages(
//         currentUser.sub,
//         currentUser.tenantId,
//         args,
//       );
//     } catch (error) {
//       console.error('Error in getChatMessages resolver:', error);
//       throw error;
//     }
//   }

  
//   @Query(() => MessagesResponse, {
//     description: 'Get messages with a specific teacher',
//   })
//   async getChatWithTeacher(
//     @Args('teacherId', { type: () => ID }) teacherId: string,
//     @Args('limit', { type: () => Number, nullable: true, defaultValue: 20 })
//     limit: number,
//     @Args('offset', { type: () => Number, nullable: true, defaultValue: 0 })
//     offset: number,
//     @ActiveUser() currentUser: ActiveUserData,
//   ): Promise<MessagesResponse> {
//     try {
//       console.log('Getting chat with teacher:', {
//         teacherId,
//         studentId: currentUser.sub,
//         tenantId: currentUser.tenantId,
//       });

//       const args: GetMessagesArgs = {
//         teacherId,
//         limit,
//         offset,
//       };

//       return await this.chatService.getMessages(
//         currentUser.sub,
//         currentUser.tenantId,
//         args,
//       );
//     } catch (error) {
//       console.error('Error in getChatWithTeacher resolver:', error);
//       throw error;
//     }
//   }

//   /**
//    * Student sends a message to a teacher
//    */
//   @Mutation(() => ChatMessage, {
//     description: 'Student sends message to a specific teacher',
//   })
//   async sendMessageToTeacher(
//     @Args('input') input: SendMessageToTeacherInput,
//     @ActiveUser() currentUser: ActiveUserData,
//   ): Promise<ChatMessage> {
//     try {
//       console.log('Student sending message to teacher:', {
//         studentUserId: currentUser.sub,
//         teacherId: input.recipientId,
//         tenantId: currentUser.tenantId,
//       });

//       // input.recipientId is TEACHER_ID (from teachers table)
//       // Service will convert it to user_id before creating the chat
//       const message = await this.chatService.sendMessageToTeacher(
//         currentUser.sub,
//         currentUser.tenantId,
//         input,
//       );

//       // Publish to subscription
//       pubSub.publish('messageAdded', { messageAdded: message });

//       return message;
//     } catch (error) {
//       console.error('Error in sendMessageToTeacher resolver:', error);
//       throw error;
//     }
//   }

//   /**
//    * Mark messages in a chat room as read
//    */
//   @Mutation(() => Boolean, {
//     description: 'Mark all messages in a chat room as read',
//   })
//   async markChatAsRead(
//     @Args('chatRoomId', { type: () => ID }) chatRoomId: string,
//     @ActiveUser() currentUser: ActiveUserData,
//   ): Promise<boolean> {
//     try {
//       return await this.chatService.markMessagesAsRead(
//         currentUser.sub,
//         chatRoomId,
//         currentUser.tenantId,
//       );
//     } catch (error) {
//       console.error('Error in markChatAsRead resolver:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get unread message count for the current student
//    */
//   @Query(() => Number, {
//     description: 'Get count of unread messages for current student',
//   })
//   async getUnreadMessageCount(
//     @ActiveUser() currentUser: ActiveUserData,
//   ): Promise<number> {
//     try {
//       return await this.chatService.getUnreadCount(
//         currentUser.sub,
//         currentUser.tenantId,
//       );
//     } catch (error) {
//       console.error('Error in getUnreadMessageCount resolver:', error);
//       return 0;
//     }
//   }

//   /**
//    * Subscribe to new messages
//    * Only receives messages from chat rooms the student is part of
//    */
//   @Subscription(() => ChatMessage, {
//     description: 'Subscribe to new messages in student chat rooms',
//     filter: (payload, variables, context) => {
//       // Only send messages to users who are participants in the chat room
//       const userId = context.connection.context.user.id;
//       return payload.messageAdded.chatRoom?.participantIds?.includes(userId);
//     },
//   })
//   messageAdded() {
//     return (pubSub as any).asyncIterator('messageAdded');
//   }
// }
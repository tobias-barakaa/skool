// import { Resolver, Mutation, Query, Args, Subscription, Int, ID } from '@nestjs/graphql';
// import { UseGuards } from '@nestjs/common';
// import { PubSub } from 'graphql-subscriptions';
// import { ChatMessage } from '../entities/chat-message.entity';
// import { ChatRoom } from '../entities/chat-room.entity';
// import { ChatService } from './chat.service';
// import { SendMessageInput } from '../dtos/send-message.input';
// import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
// import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';

// const pubSub = new PubSub();

// @Resolver(() => ChatMessage)
// export class ChatResolver {
//   constructor(private readonly chatService: ChatService) {}

//   /**
//    * Send message from teacher to a specific student
//    */
//   @Mutation(() => ChatMessage, {
//     description: 'Send a message from teacher to a specific student',
//   })
//   async sendMessageToStudent(
//     @Args('input') input: SendMessageInput,
//     @ActiveUser() currentUser: ActiveUserData,
//   ): Promise<ChatMessage> {
//     const message = await this.chatService.sendMessageToStudent(
//       currentUser.sub,
//       currentUser.tenantId,
//       input,
//     );

//     // Publish to subscriptions
//     pubSub.publish('messageAdded', { messageAdded: message });
//     pubSub.publish(`messageAddedToRoom_${message.chatRoomId}`, {
//       messageAddedToRoom: message,
//     });

//     return message;
//   }

//   /**
//    * Send message from teacher to a specific parent
//    */
//   @Mutation(() => ChatMessage, {
//     description: 'Send a message from teacher to a specific parent',
//   })
//   async sendMessageToParent(
//     @Args('input') input: SendMessageInput,
//     @ActiveUser() currentUser: ActiveUserData,
//   ): Promise<ChatMessage> {
//     const message = await this.chatService.sendMessageToParent(
//       currentUser.sub,
//       currentUser.tenantId,
//       input,
//     );

//     pubSub.publish('messageAdded', { messageAdded: message });
//     pubSub.publish(`messageAddedToRoom_${message.chatRoomId}`, {
//       messageAddedToRoom: message,
//     });

//     return message;
//   }

//   /**
//    * Broadcast message to all students
//    */
//   @Mutation(() => [ChatMessage], {
//     description: 'Broadcast a message from teacher to all active students',
//   })
//   async broadcastToAllStudents(
//     @Args('input') input: BroadcastMessageInput,
//     @ActiveUser() currentUser: ActiveUserData,
//   ): Promise<ChatMessage[]> {
//     const messages = await this.chatService.broadcastToAllStudents(
//       currentUser.sub,
//       currentUser.tenantId,
//       input,
//     );

//     // Publish each message
//     messages.forEach((message) => {
//       pubSub.publish('messageAdded', { messageAdded: message });
//       pubSub.publish(`messageAddedToRoom_${message.chatRoomId}`, {
//         messageAddedToRoom: message,
//       });
//     });

//     return messages;
//   }

//   /**
//    * Broadcast message to all parents
//    */
//   @Mutation(() => [ChatMessage], {
//     description: 'Broadcast a message from teacher to all active parents',
//   })
//   async broadcastToAllParents(
//     @Args('input') input: BroadcastMessageInput,
//     @ActiveUser() currentUser: ActiveUserData,
//   ): Promise<ChatMessage[]> {
//     const messages = await this.chatService.broadcastToAllParents(
//       currentUser.sub,
//       currentUser.tenantId,
//       input,
//     );

//     messages.forEach((message) => {
//       pubSub.publish('messageAdded', { messageAdded: message });
//       pubSub.publish(`messageAddedToRoom_${message.chatRoomId}`, {
//         messageAddedToRoom: message,
//       });
//     });

//     return messages;
//   }

//   /**
//    * Send reply in an existing chat
//    */
//   @Mutation(() => ChatMessage, {
//     description: 'Send a reply in an existing chat room (student/parent/teacher)',
//   })
//   async sendReply(
//     @Args('input') input: SendReplyInput,
//     @ActiveUser() currentUser: ActiveUserData,
//   ): Promise<ChatMessage> {
//     const message = await this.chatService.sendReply(
//       currentUser.sub,
//       input.chatRoomId,
//       input.message,
//       input.imageUrl,
//     );

//     pubSub.publish('messageAdded', { messageAdded: message });
//     pubSub.publish(`messageAddedToRoom_${message.chatRoomId}`, {
//       messageAddedToRoom: message,
//     });

//     return message;
//   }

//   /**
//    * Send message to all parents of a specific student
//    */
//   @Mutation(() => [ChatMessage], {
//     description: "Send message to all parents of a specific student",
//   })
//   async sendMessageToStudentParents(
//     @Args('studentId', { type: () => ID }) studentId: string,
//     @Args('subject', { nullable: true }) subject: string,
//     @Args('message') message: string,
//     @Args('imageUrl', { nullable: true }) imageUrl: string,
//     @ActiveUser() currentUser: ActiveUserData,
//   ): Promise<ChatMessage[]> {
//     const messages = await this.chatService.sendMessageToStudentParents(
//       currentUser.sub,
//       currentUser.tenantId,
//       studentId,
//       { subject, message, imageUrl },
//     );

//     messages.forEach((msg) => {
//       pubSub.publish('messageAdded', { messageAdded: msg });
//       pubSub.publish(`messageAddedToRoom_${msg.chatRoomId}`, {
//         messageAddedToRoom: msg,
//       });
//     });

//     return messages;
//   }

//   /**
//    * Mark messages in a room as read
//    */
//   @Mutation(() => Boolean, {
//     description: 'Mark all unread messages in a chat room as read',
//   })
//   async markMessagesAsRead(
//     @Args('chatRoomId', { type: () => ID }) chatRoomId: string,
//     @ActiveUser() currentUser: ActiveUserData,
//   ): Promise<boolean> {
//     return this.chatService.markMessagesAsRead(currentUser.sub, chatRoomId);
//   }

//   /**
//    * Get chat history for a room
//    */
//   @Query(() => [ChatMessage], {
//     description: 'Get chat history for a specific chat room',
//   })
//   async getChatHistory(
//     @Args('chatRoomId', { type: () => ID }) chatRoomId: string,
//     @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
//     @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
//     @ActiveUser() currentUser: ActiveUserData,
//   ): Promise<ChatMessage[]> {
//     return this.chatService.getChatHistory(
//       currentUser.sub,
//       chatRoomId,
//       limit,
//       offset,
//     );
//   }

//   /**
//    * Get unread message count
//    */
//   @Query(() => Int, {
//     description: 'Get unread message count for current user',
//   })
//   async getUnreadCount(
//     @Args('chatRoomId', { type: () => ID, nullable: true }) chatRoomId: string,
//     @ActiveUser() currentUser: ActiveUserData,
//   ): Promise<number> {
//     return this.chatService.getUnreadCount(currentUser.sub, chatRoomId);
//   }

//   /**
//    * Get all chat rooms for current user
//    */
//   @Query(() => [ChatRoom], {
//     description: 'Get all chat rooms for the current user',
//   })
//   async getUserChatRooms(
//     @ActiveUser() currentUser: ActiveUserData,
//   ): Promise<ChatRoom[]> {
//     return this.chatService.getUserChatRooms(
//       currentUser.sub,
//       currentUser.tenantId,
//     );
//   }

//   /**
//    * Get a specific chat room by ID
//    */
//   @Query(() => ChatRoom, {
//     description: 'Get a specific chat room by ID',
//     nullable: true,
//   })
//   async getChatRoom(
//     @Args('chatRoomId', { type: () => ID }) chatRoomId: string,
//     @ActiveUser() currentUser: ActiveUserData,
//   ): Promise<ChatRoom | null> {
//     const rooms = await this.chatService.getUserChatRooms(
//       currentUser.sub,
//       currentUser.tenantId,
//     );
//     return rooms.find(room => room.id === chatRoomId) || null;
//   }

//   /**
//    * Subscription for new messages
//    */
//   @Subscription(() => ChatMessage, {
//     description: 'Subscribe to all new messages',
//   })
//   messageAdded() {
//     return pubSub.asyncIterator('messageAdded');
//   }

//   /**
//    * Subscription for messages in a specific room
//    */
//   @Subscription(() => ChatMessage, {
//     description: 'Subscribe to new messages in a specific chat room',
//     resolve: (payload) => payload.messageAddedToRoom,
//   })
//   messageAddedToRoom(
//     @Args('chatRoomId', { type: () => ID }) chatRoomId: string,
//   ) {
//     return pubSub.asyncIterator(`messageAddedToRoom_${chatRoomId}`);
//   }
// }
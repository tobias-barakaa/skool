import { Resolver, Mutation, Query, Args, Subscription, Int } from '@nestjs/graphql';
import { Inject, UseGuards } from '@nestjs/common';
import { PubSub, PubSubEngine } from 'graphql-subscriptions';
import { ChatService } from './providers/chat.service';
import { RedisChatProvider } from './providers/redis-chat.provider';
import { ChatMessage } from './entities/chat-message.entity';
import { BroadcastMessageInput, SendMessageInput, TypingIndicator } from './dtos/send-message.input';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { ChatRoom } from './entities/chat-room.entity';
import { SendMessageFromParentToTeacherInput } from './dtos/send-message-from-parent-to-teacher.input';

// const pubSub = new PubSub() as PubSubEngine;

@Resolver()
export class ChatResolver {
  constructor(
    @Inject('PUB_SUB') private readonly pubSub, 
    private readonly chatService: ChatService,
    private readonly redisChatProvider: RedisChatProvider,
  ) {}

  // ==================== MUTATIONS ====================

  /**
   * Send message from teacher to a specific student
   * 
   * Example:
   * mutation {
   *   sendMessageToStudent(input: {
   *     recipientId: "student-uuid"
   *     recipientType: "STUDENT"
   *     subject: "Assignment Reminder"
   *     message: "Please submit your homework by tomorrow."
   *     imageUrl: "https://example.com/image.jpg"
   *   }) {
   *     id
   *     message
   *     subject
   *     createdAt
   *     chatRoom { id name }
   *   }
   * }
   */
  @Mutation(() => ChatMessage, {
    description: 'Send a message from teacher to a specific student',
  })
  async sendMessageToStudent(
    @Args('input') input: SendMessageInput,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<ChatMessage> {
    const message = await this.chatService.sendMessageToStudent(
      currentUser.sub,
      currentUser.tenantId,
      input,
    );

    this.pubSub.publish('messageAdded', { messageAdded: message });
    return message;
  }


  @Mutation(() => Boolean, {
    description: 'Delete a message sent by the current teacher',
  })
  async deleteTeacherMessage(
    @Args('messageId') messageId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<boolean> {
    return await this.chatService.deleteMessage(
      currentUser.sub,       // teacher's userId
      currentUser.tenantId,
      messageId,
    );
  }
  

  /**
   * Send message from teacher to a specific parent
   * 
   * Example:
   * mutation {
   *   sendMessageToParent(input: {
   *     recipientId: "parent-uuid"
   *     recipientType: "PARENT"
   *     subject: "Student Progress Update"
   *     message: "Your child is doing excellent work!"
   *   }) {
   *     id
   *     message
   *     createdAt
   *   }
   * }
   */
  @Mutation(() => ChatMessage, {
    description: 'Send a message from teacher to a specific parent',
  })
  async sendMessageToParent(
    @Args('input') input: SendMessageInput,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<ChatMessage> {
    const message = await this.chatService.sendMessageToParent(
      currentUser.sub,
      currentUser.tenantId,
      input,
    );

    this.pubSub.publish('messageAdded', { messageAdded: message });
    return message;
  }

  /**
   * Broadcast message to all students in the school
   * 
   * Example:
   * mutation {
   *   broadcastToAllStudents(input: {
   *     recipientType: "STUDENT"
   *     subject: "School Announcement"
   *     message: "Classes will resume on Monday"
   *   }) {
   *     id
   *     message
   *     createdAt
   *   }
   * }
   */
  @Mutation(() => [ChatMessage], {
    description: 'Broadcast a message to all students in the school',
  })
  async broadcastToAllStudents(
    @Args('input') input: BroadcastMessageInput,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<ChatMessage[]> {
    const messages = await this.chatService.broadcastToAllStudents(
      currentUser.sub,
      currentUser.tenantId,
      input,
    );

    // Publish each message for real-time updates
    messages.forEach((message) => {
      this.pubSub.publish('messageAdded', { messageAdded: message });
    });

    return messages;
  }

  /**
   * Broadcast message to all pa    ChatProvider,
rents in the school
   * 
   * Example:
   * mutation {
   *   broadcastToAllParents(input: {
   *     recipientType: "PARENT"
   *     subject: "Parent Meeting"
   *     message: "Annual parent meeting scheduled for next Friday"
   *   }) {
   *     id
   *     message
   *     createdAt
   *   }
   * }
   */
  @Mutation(() => [ChatMessage], {
    description: 'Broadcast a message to all parents in the school',
  })
  async broadcastToAllParents(
    @Args('input') input: BroadcastMessageInput,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<ChatMessage[]> {
    const messages = await this.chatService.broadcastToAllParents(
      currentUser.sub,
      currentUser.tenantId,
      input,
    );

    messages.forEach((message) => {
      this.pubSub.publish('messageAdded', { messageAdded: message });
    });

    return messages;
  }

  /**
   * Mark all messages in a chat room as read
   * 
   * Example:
   * mutation {
   *   markMessagesAsRead(chatRoomId: "room-uuid")
   * }
   */
  @Mutation(() => Boolean, {
    description: 'Mark all messages in a chat room as read',
  })
  async markMessagesAsRead(
    @Args('chatRoomId') chatRoomId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<boolean> {
    return await this.chatService.markMessagesAsRead(
      currentUser.sub,
      chatRoomId,
    );
  }

  /**
   * Send message from parent to teacher
   * 
   * Example:
   * mutation {
   *   sendMessageFromParentToTeacher(input: {
   *     recipientId: "teacher-uuid"
   *     recipientType: "TEACHER"
   *     studentId: "student-uuid"
   *     subject: "Question about homework"
   *     message: "Could you explain the math assignment?"
   *   }) {
   *     id
   *     message
   *     createdAt
   *   }
   * }
   */
  // @Mutation(() => ChatMessage, {
  //   description: 'Send a message from parent to teacher about their child',
  // })
  // async sendMessageFromParentToTeacher(
  //   @Args('input') input: SendMessageInput & { studentId: string },
  //   @ActiveUser() currentUser: ActiveUserData,
  // ): Promise<ChatMessage> {
  //   const message = await this.chatService.sendMessageFromParentToTeacher(
  //     currentUser.sub,
  //     currentUser.tenantId,
  //     input,
  //   );

  //   this.pubSub.publish('messageAdded', { messageAdded: message });
  //   return message;
  // }

  @Mutation(() => ChatMessage, {
    description: 'Send a message from parent to teacher about their child',
  })
  async sendMessageFromParentToTeacher(
    @Args('input', { type: () => SendMessageFromParentToTeacherInput })
    input: SendMessageFromParentToTeacherInput,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<ChatMessage> {
    const message = await this.chatService.sendMessageFromParentToTeacher(
      currentUser.sub,
      currentUser.tenantId,
      input,
    );
  
    this.pubSub.publish('messageAdded', { messageAdded: message });
    return message;
  }

  // ==================== QUERIES ====================

  /**
   * Get chat history for a specific room
   * 
   * Example:
   * query {
   *   getChatHistory(chatRoomId: "room-uuid", limit: 50, offset: 0) {
   *     id
   *     message
   *     subject
   *     senderId
   *     senderType
   *     isRead
   *     createdAt
   *     chatRoom {
   *       id
   *       name
   *     }
   *   }
   * }
   */
  @Query(() => [ChatMessage], {
    description: 'Get chat history for a specific room with pagination',
  })
  async getChatHistory(
    @Args('chatRoomId') chatRoomId: string,
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<ChatMessage[]> {
    return await this.chatService.getChatHistory(
      currentUser.sub,
      chatRoomId,
      limit,
      offset,
    );
  }

  /**
   * Get all chat rooms for the current user
   * 
   * Example:
   * query {
   *   getUserChatRooms {
   *     id
   *     name
   *     type
   *     participantIds
   *     createdAt
   *     updatedAt
   *   }
   * }
   */
 // File: chat.resolver.ts or similar
@Query(() => [ChatRoom], {
  description: 'Get all chat rooms for the current user',
})
async getUserChatRooms(
  @ActiveUser() currentUser: ActiveUserData,
): Promise<ChatRoom[]> {
  return await this.chatService.getUserChatRooms(currentUser.sub); // This now calls the updated service
}

  /**
   * Get total unread message count for the current user
   * 
   * Example:
   * query {
   *   getUnreadMessageCount
   * }
   */
  @Query(() => Int, {
    description: 'Get total unread message count for the current user',
  })
  async getUnreadMessageCount(
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<number> {
    return await this.chatService.getUnreadCount(currentUser.sub);
  }

  /**
   * Get unread count for a specific room
   * 
   * Example:
   * query {
   *   getUnreadCountForRoom(chatRoomId: "room-uuid")
   * }
   */
  @Query(() => Int, {
    description: 'Get unread message count for a specific room',
  })
  async getUnreadCountForRoom(
    @Args('chatRoomId') chatRoomId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<number> {
    return await this.redisChatProvider.getUnreadCount(
      currentUser.sub,
      chatRoomId,
    );
  }

  /**
   * Get all rooms with unread messages
   * 
   * Example:
   * query {
   *   getUnreadRooms
   * }
   */
  @Query(() => [String], {
    description: 'Get all room IDs that have unread messages for the current user',
  })
  async getUnreadRooms(
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<string[]> {
    return await this.redisChatProvider.getUnreadRooms(currentUser.sub);
  }

  /**
   * Check if a user is currently online
   * 
   * Example:
   * query {
   *   isUserOnline(userId: "user-uuid")
   * }
   */
  @Query(() => Boolean, {
    description: 'Check if a specific user is currently online',
  })
  async isUserOnline(
    @Args('userId') userId: string,
  ): Promise<boolean> {
    return await this.redisChatProvider.isUserOnline(userId);
  }

  /**
   * Get user's last seen timestamp
   * 
   * Example:
   * query {
   *   getUserLastSeen(userId: "user-uuid")
   * }
   */
  @Query(() => String, { nullable: true, description: 'Get user last seen timestamp' })
  async getUserLastSeen(
    @Args('userId') userId: string,
  ): Promise<string | null> {
    const timestamp = await this.redisChatProvider.getUserLastSeen(userId);
    return timestamp ? new Date(timestamp).toISOString() : null;
  }

  // ==================== SUBSCRIPTIONS ====================

  /**
   * Subscribe to new messages in real-time
   * 
   * Example:
   * subscription {
   *   messageAdded {
   *     id
   *     message
   *     subject
   *     senderId
   *     senderType
   *     createdAt
   *     chatRoom {
   *       id
   *       name
   *     }
   *   }
   * }
   */
  @Subscription(() => ChatMessage, {
    description: 'Subscribe to new messages in real-time',
  })
  messageAdded() {
    return this.pubSub.asyncIterator('messageAdded');
    // return (this.pubSub as PubSub).asyncIterator('messageAdded');

  }

  /**
   * Subscribe to typing indicators for a specific room
   * 
   * Example:
   * subscription {
   *   userTyping(roomId: "room-uuid") {
   *     userId
   *     isTyping
   *   }
   * }
   */
  @Subscription(() => TypingIndicator, {
    description: 'Subscribe to typing indicators for a room',
    resolve: (payload) => payload,
  })
  userTyping(@Args('roomId') roomId: string) {
    return this.pubSub.asyncIterator(`typing:${roomId}`);
  }
}
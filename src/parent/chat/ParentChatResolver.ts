import { Resolver, Mutation, Query, Args, Subscription, Int } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { Teacher } from 'src/admin/teacher/entities/teacher.entity';
import { ChatMessage } from 'src/messaging/entities/chat-message.entity';
import { ChatRoom } from 'src/messaging/entities/chat-room.entity';
import { SendMessageFromParentInput } from './dtos/ParentChatDto';
import { ParentChatService } from './ParentChatService';
import { RedisChatProvider } from 'src/messaging/providers/redis-chat.provider';
import { TypingIndicator } from 'src/messaging/dtos/send-message.input';
import { Roles } from 'src/iam/decorators/roles.decorator';
import { MembershipRole } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';

@Resolver()
@Roles(MembershipRole.PARENT)
export class ParentChatResolver {
  constructor(
    @Inject('PUB_SUB') private readonly pubSub,
    private readonly parentChatService: ParentChatService,
    private readonly redisChatProvider: RedisChatProvider,
  ) {}

  // ==================== MUTATIONS ====================

  /**
   * Send message from parent to teacher about their child
   * 
   * Example:
   * mutation {
   *   sendMessageToTeacher(input: {
   *     recipientId: "teacher-uuid"
   *     studentId: "student-uuid"
   *     subject: "Question about homework"
   *     message: "Could you explain the math assignment?"
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
    description: 'Send a message from parent to teacher about their child',
  })
  async sendMessageToTeacher(
    @Args('input') input: SendMessageFromParentInput,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<ChatMessage> {
    const message = await this.parentChatService.sendMessageToTeacher(
      currentUser,
      { ...input, recipientType: 'TEACHER' },
    );

    this.pubSub.publish('messageAdded', { messageAdded: message });
    return message;
  }

  
    // Delete a message sent by the current parent
    
    // Example:
    // mutation {
    //   deleteParentMessage(messageId: "msg-uuid")
    // }
  
  @Mutation(() => Boolean, {
    description: 'Delete a message sent by the current parent',
  })
  async deleteParentMessage(
    @Args('messageId') messageId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<boolean> {
    return await this.parentChatService.deleteMessage(
      currentUser,
      messageId,
    );
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
    return await this.parentChatService.markMessagesAsRead(
      currentUser.sub,
      chatRoomId,
    );
  }

  /**
   * Mark single message as read
   * 
   * Example:
   * mutation {
   *   markMessageAsRead(messageId: "msg-uuid")
   * }
   */
  @Mutation(() => Boolean, {
    description: 'Mark a single message as read',
  })
  async markMessageAsRead(
    @Args('messageId') messageId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<boolean> {
    return await this.parentChatService.markMessageAsRead(
      currentUser.sub,
      messageId,
    );
  }

  // ==================== QUERIES ====================

  
    // Get chat history for a specific room
    
    // Example:
    // query {
    //   getChatHistory(chatRoomId: "room-uuid", limit: 50, offset: 0) {
    //     id
    //     message
    //     subject
    //     senderId
    //     senderType
    //     isRead
    //     createdAt
    //     chatRoom {
    //       id
    //       name
    //     }
    //   }
    // }
  
  @Query(() => [ChatMessage], {
    description: 'Get chat history for a specific room with pagination',
  })
  async getChatHistory(
    @Args('chatRoomId') chatRoomId: string,
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<ChatMessage[]> {
    return await this.parentChatService.getChatHistory(
      currentUser.sub,
      chatRoomId,
      limit,
      offset,
    );
  }

  
    // Get all chat rooms for the current parent
    
    // Example:
    // query {
    //   getParentChatRooms {
    //     id
    //     name
    //     type
    //     participantIds
    //     createdAt
    //     updatedAt
    //     messages {
    //       id
    //       message
    //       createdAt
    //     }
    //   }
    // }
  
  @Query(() => [ChatRoom], {
    description: 'Get all chat rooms for the current parent',
  })
  async getParentChatRooms(
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<ChatRoom[]> {
    return await this.parentChatService.getUserChatRooms(currentUser.sub);
  }

  /**
   * Get total unread message count for the current parent
   * 
   * Example:
   * query {
   *   getUnreadMessageCount
   * }
   */
  @Query(() => Int, {
    description: 'Get total unread message count for the current parent',
  })
  async getUnreadMessageCount(
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<number> {
    return await this.parentChatService.getUnreadCount(currentUser.sub);
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
    description: 'Get all room IDs that have unread messages for the current parent',
  })
  async getUnreadRooms(
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<string[]> {
    return await this.redisChatProvider.getUnreadRooms(currentUser.sub);
  }

  /**
   * Get unread messages for current parent
   * 
   * Example:
   * query {
   *   getUnreadMessages {
   *     id
   *     message
   *     subject
   *     senderId
   *     senderType
   *     createdAt
   *     isRead
   *     chatRoom {
   *       id
   *       name
   *     }
   *   }
   * }
   */
  @Query(() => [ChatMessage], {
    description: 'Get all unread messages for the current parent',
  })
  async getUnreadMessages(
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<ChatMessage[]> {
    return await this.parentChatService.getUnreadMessages(currentUser.sub);
  }

  /**
   * Get read messages for current parent
   * 
   * Example:
   * query {
   *   getReadMessages(limit: 50) {
   *     id
   *     message
   *     subject
   *     createdAt
   *   }
   * }
   */
  @Query(() => [ChatMessage], {
    description: 'Get all read messages for the current parent',
  })
  async getReadMessages(
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<ChatMessage[]> {
    return await this.parentChatService.getReadMessages(currentUser.sub, limit);
  }

  /**
   * Get list of teachers for a specific student
   * 
   * Example:
   * query {
   *   getTeachersForStudent(studentId: "student-uuid") {
   *     id
   *     name
   *     email
   *     subject
   *   }
   * }
   */
  @Query(() => [Teacher], {
    description: 'Get list of teachers for a specific student (parent can see who to message)',
  })
  async getTeachersForStudent(
    @Args('studentId') studentId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<Teacher[]> {
    return await this.parentChatService.getTeachersForStudent(
      currentUser,
      studentId,
    );
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


   /**
   * Get chat room with a specific teacher
   * 
   * Example:
   * query {
   *   getChatRoomWithTeacher(teacherId: "teacher-uuid") {
   *     id
   *     name
   *     type
   *     participantIds
   *     messages {
   *       id
   *       message
   *       createdAt
   *     }
   *   }
   * }
   */
   @Query(() => ChatRoom, { nullable: true })
   async getChatRoomWithTeacher(
     @Args('teacherId') teacherId: string,
     @ActiveUser() currentUser: ActiveUserData,
   ): Promise<ChatRoom | null> {
     return await this.parentChatService.getChatRoomWithTeacher(
       currentUser,
       teacherId,
     );
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
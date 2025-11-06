import { Resolver, Mutation, Query, Args, Subscription, Int } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { Teacher } from 'src/admin/teacher/entities/teacher.entity';
import { StudentChatService } from './chat.service';
import { RedisChatProvider } from 'src/messaging/providers/redis-chat.provider';
import { ChatMessage } from 'src/messaging/entities/chat-message.entity';
import { SendMessageFromStudentToTeacherInput } from './dtos/chat-message.dto.teacher';
import { ActiveUser } from 'src/admin/auth/decorator/active-user.decorator';
import { ChatRoom } from 'src/messaging/entities/chat-room.entity';
import { TypingIndicator } from 'src/messaging/dtos/send-message.input';

@Resolver()
export class StudentChatResolver {
  constructor(
    @Inject('PUB_SUB') private readonly pubSub,
    private readonly studentChatService: StudentChatService,
    private readonly redisChatProvider: RedisChatProvider,
  ) {}

  // ==================== MUTATIONS ====================

  /**
   * SEND MESSAGE TO TEACHER
   * Student sends a message to their teacher
   * 
   * Example:
   * mutation {
   *   sendMessageToTeacher(input: {
   *     recipientId: "teacher-uuid-here"
   *     recipientType: "TEACHER"
   *     subject: "Question about homework"
   *     message: "Could you please explain the math assignment?"
   *     imageUrl: "https://example.com/image.jpg"
   *   }) {
   *     id
   *     message
   *     subject
   *     senderId
   *     senderType
   *     isRead
   *     imageUrl
   *     createdAt
   *     chatRoom {
   *       id
   *       name
   *       type
   *       participantIds
   *     }
   *   }
   * }
   */
  @Mutation(() => ChatMessage, {
    nullable: true, // optional if you want to suppress schema errors
    description: 'Send a message from student to a specific teacher',
  })
  async studentSendMessageToTeacher(
    @Args('input', { type: () => SendMessageFromStudentToTeacherInput })
    input: SendMessageFromStudentToTeacherInput,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<ChatMessage | null> {
    const message = await this.studentChatService.sendMessageToTeacher(
      currentUser,
      input,
    );
  
    if (!message) return null; 
    this.pubSub.publish('messageAdded', { messageAdded: message });
    return message;
  }
  /**
   * MARK MESSAGES AS READ
   * Mark all unread messages in a chat room as read
   * 
   * Example:
   * mutation {
   *   studentMarkMessagesAsRead(chatRoomId: "1a6f156b-84a7-4775-8818-35f778bc0798")
   * }
   * 
   * Returns: true
   */
  @Mutation(() => Boolean, {
    description: 'Mark all messages in a chat room as read (student marks teacher messages as read)',
  })
  async studentMarkMessagesAsRead(
    @Args('chatRoomId') chatRoomId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<boolean> {
    return await this.studentChatService.markMessagesAsRead(
      currentUser,
      chatRoomId,
    );
  }

  /**
   * SET TYPING INDICATOR
   * Notify teacher that student is typing
   * 
   * Example:
   * mutation {
   *   studentSetTyping(
   *     chatRoomId: "1a6f156b-84a7-4775-8818-35f778bc0798"
   *     isTyping: true
   *   )
   * }
   * 
   * Returns: true
   */
  @Mutation(() => Boolean, {
    description: 'Set typing indicator for student in a chat room',
  })
  async studentSetTyping(
    @Args('chatRoomId') chatRoomId: string,
    @Args('isTyping') isTyping: boolean,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<boolean> {
    await this.redisChatProvider.setTypingIndicator(
      currentUser,
      chatRoomId,
      isTyping,
    );

    this.pubSub.publish(`typing:${chatRoomId}`, {
      userId: currentUser.sub,
      roomId: chatRoomId,
      isTyping,
    });

    return true;
  }

  // ==================== QUERIES ====================

  /**
   * GET CHAT HISTORY
   * Get all messages in a conversation with a teacher (includes messages FROM teacher)
   * 
   * Example:
   * query {
   *   getStudentChatHistory(
   *     chatRoomId: "1a6f156b-84a7-4775-8818-35f778bc0798"
   *     limit: 50
   *     offset: 0
   *   ) {
   *     id
   *     message
   *     subject
   *     senderId
   *     senderType
   *     isRead
   *     imageUrl
   *     createdAt
   *     chatRoom {
   *       id
   *       name
   *       type
   *       participantIds
   *     }
   *   }
   * }
   */
  @Query(() => [ChatMessage], {
    description: 'Get chat history for a specific room - includes ALL messages (sent by student AND received from teacher)',
  })
  async getStudentChatHistory(
    @Args('chatRoomId') chatRoomId: string,
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<ChatMessage[]> {
    return await this.studentChatService.getChatHistory(
      currentUser,
      chatRoomId,
      limit,
      offset,
    );
  }

  /**
   * GET RECEIVED MESSAGES
   * Get only messages received FROM teachers (not sent by student)
   * 
   * Example:
   * query {
   *   getReceivedMessages(
   *     chatRoomId: "1a6f156b-84a7-4775-8818-35f778bc0798"
   *     limit: 50
   *     offset: 0
   *   ) {
   *     id
   *     message
   *     subject
   *     senderId
   *     senderType
   *     isRead
   *     imageUrl
   *     createdAt
   *     chatRoom {
   *       id
   *       name
   *     }
   *   }
   * }
   */
  // @Query(() => [ChatMessage], {
  //   description: 'Get only messages RECEIVED from teachers (excludes student\'s own messages)',
  // })
  // async getReceivedMessages(
  //   @Args('chatRoomId', { nullable: true }) chatRoomId?: string,
  //   @Args('limit', { type: () => Int, defaultValue: 50 }) limit?: number,
  //   @Args('offset', { type: () => Int, defaultValue: 0 }) offset?: number,
  //   @ActiveUser() currentUser?: ActiveUserData,
  // ): Promise<ChatMessage[]> {
  //   return await this.studentChatService.getReceivedMessages(
  //     currentUser.sub,
  //     chatRoomId,
  //     limit,
  //     offset,
  //   );
  // }

  /**
   * GET ALL RECEIVED MESSAGES (ACROSS ALL ROOMS)
   * Get messages from ALL teachers across all chat rooms
   * 
   * Example:
   * query {
   *   getAllReceivedMessages(limit: 100, offset: 0) {
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
  // @Query(() => [ChatMessage], {
  //   description: 'Get ALL messages received from teachers across all chat rooms',
  // })
  // async getAllReceivedMessages(
  //   @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
  //   @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  //   @ActiveUser() currentUser: ActiveUserData,
  // ): Promise<ChatMessage[]> {
  //   return await this.studentChatService.getAllReceivedMessages(
  //     currentUser.sub,
  //     currentUser.tenantId,
  //     limit,
  //     offset,
  //   );
  // }

  /**
   * GET ALL CHAT ROOMS
   * Get all chat rooms/conversations for the current student
   * 
   * Example:
   * query {
   *   getStudentChatRooms {
   *     id
   *     name
   *     type
   *     participantIds
   *     createdAt
   *     updatedAt
   *   }
   * }
   */
  @Query(() => [ChatRoom], {
    description: 'Get all chat rooms for the current student',
  })
  async getStudentChatRooms(
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<ChatRoom[]> {
    return await this.studentChatService.getStudentChatRooms(currentUser.sub);
  }


  @Query(() => ChatMessage, { name: 'getMessageById', nullable: true })
  async getMessageById(
    @Args('id') id: string,
    @ActiveUser() currentUser?: ActiveUserData, // optional: will be undefined if called internally
  ): Promise<ChatMessage> {
    // pass currentUser.sub to service so permission check runs
    const userId = currentUser?.sub;
    return await this.studentChatService.getMessageById(id, userId);
  }

  @Mutation(() => Boolean, {
    description: 'Delete a message sent by the current student',
  })
  async deleteStudentMessage(
    @Args('messageId') messageId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<boolean> {
    return await this.studentChatService.deleteMessage(
      currentUser,
      messageId,
    );
  }

  
  /**
   * GET TOTAL UNREAD MESSAGE COUNT
   * Get total number of unread messages across all conversations
   * 
   * Example:
   * query {
   *   getStudentUnreadMessageCount
   * }
   * 
   * Returns: 5 (for example)
   */
  @Query(() => Int, {
    description: 'Get total unread message count for the current student',
  })
  async getStudentUnreadMessageCount(
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<number> {
    return await this.studentChatService.getUnreadCount(currentUser.sub);
  }

  /**
   * GET UNREAD COUNT FOR SPECIFIC ROOM
   * Get unread message count for a specific conversation
   * 
   * Example:
   * query {
   *   getStudentUnreadCountForRoom(chatRoomId: "1a6f156b-84a7-4775-8818-35f778bc0798")
   * }
   * 
   * Returns: 3 (for example)
   */
  @Query(() => Int, {
    description: 'Get unread message count for a specific room',
  })
  async getStudentUnreadCountForRoom(
    @Args('chatRoomId') chatRoomId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<number> {
    return await this.redisChatProvider.getUnreadCount(
      currentUser.sub,
      chatRoomId,
    );
  }

  /**
   * GET ROOMS WITH UNREAD MESSAGES
   * Get list of room IDs that have unread messages
   * 
   * Example:
   * query {
   *   getStudentUnreadRooms
   * }
   * 
   * Returns: ["room-id-1", "room-id-2", "room-id-3"]
   */
  @Query(() => [String], {
    description: 'Get all room IDs that have unread messages for the current student',
  })
  async getStudentUnreadRooms(
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<string[]> {
    return await this.redisChatProvider.getUnreadRooms(currentUser.sub);
  }

  /**
   * GET CHAT ROOM WITH SPECIFIC TEACHER
   * Find existing conversation with a specific teacher
   * 
   * Example:
   * query {
   *   getChatRoomWithTeacher(teacherId: "teacher-uuid-here") {
   *     id
   *     name
   *     type
   *     participantIds
   *     createdAt
   *     updatedAt
   *   }
   * }
   */
  @Query(() => ChatRoom, { 
    nullable: true,
    description: 'Get chat room with a specific teacher (returns null if no conversation exists)' 
  })
  async getChatRoomWithTeacher(
    @Args('teacherId') teacherId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<ChatRoom | null> {
    return await this.studentChatService.getChatRoomWithTeacher(
      currentUser,
      teacherId
    );
  }

  /**
   * GET ALL TEACHERS STUDENT HAS CHATTED WITH
   * Get list of all teachers the student has conversations with
   * 
   * Example:
   * query {
   *   getStudentTeachers {
   *     id
   *     fullName
   *     firstName
   *     lastName
   *     email
   *     department
   *     phoneNumber
   *     user {
   *       id
   *       name
   *       email
   *     }
   *   }
   * }
   */
  @Query(() => [Teacher], {
    description: 'Get all teachers that the student has chat conversations with',
  })
  async getStudentTeachers(
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<Teacher[]> {
    return await this.studentChatService.getStudentTeachers(
      currentUser
    );
  }

  /**
   * CHECK IF TEACHER IS ONLINE
   * Check if a specific teacher is currently online
   * 
   * Example:
   * query {
   *   isTeacherOnline(teacherUserId: "teacher-user-uuid")
   * }
   * 
   * Returns: true or false
   */
  @Query(() => Boolean, {
    description: 'Check if a specific teacher is currently online',
  })
  async isTeacherOnline(
    @Args('teacherUserId') teacherUserId: string,
  ): Promise<boolean> {
    return await this.redisChatProvider.isUserOnline(teacherUserId);
  }

  /**
   * GET TEACHER'S LAST SEEN TIME
   * Get when a teacher was last active
   * 
   * Example:
   * query {
   *   getTeacherLastSeen(teacherUserId: "teacher-user-uuid")
   * }
   * 
   * Returns: "2024-10-24T10:30:00.000Z" or null
   */
  @Query(() => String, { 
    nullable: true, 
    description: 'Get teacher last seen timestamp (ISO format)' 
  })
  async getTeacherLastSeen(
    @Args('teacherUserId') teacherUserId: string,
  ): Promise<string | null> {
    const timestamp = await this.redisChatProvider.getUserLastSeen(teacherUserId);
    return timestamp ? new Date(timestamp).toISOString() : null;
  }

  // ==================== SUBSCRIPTIONS ====================

  /**
   * SUBSCRIBE TO NEW MESSAGES (REAL-TIME)
   * Listen for new messages in real-time (both sent and received)
   * 
   * Example:
   * subscription {
   *   studentMessageAdded {
   *     id
   *     message
   *     subject
   *     senderId
   *     senderType
   *     isRead
   *     imageUrl
   *     createdAt
   *     chatRoom {
   *       id
   *       name
   *     }
   *   }
   * }
   */
  @Subscription(() => ChatMessage, {
    description: 'Subscribe to new messages in real-time (receives messages FROM teachers instantly)',
  })
  

  /**
   * SUBSCRIBE TO TYPING INDICATORS (REAL-TIME)
   * Listen for when teacher is typing
   * 
   * Example:
   * subscription {
   *   studentUserTyping(roomId: "1a6f156b-84a7-4775-8818-35f778bc0798") {
   *     userId
   *     roomId
   *     isTyping
   *   }
   * }
   */
  @Subscription(() => TypingIndicator, {
    description: 'Subscribe to typing indicators for a room (see when teacher is typing)',
    resolve: (payload) => payload,
  })
  studentUserTyping(@Args('roomId') roomId: string) {
    return this.pubSub.asyncIterator(`typing:${roomId}`);
  }




  
  @Query(() => [ChatMessage], {
    description: 'Get all unread messages for the current student',
  })
  async getStudentUnreadMessages(
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<ChatMessage[]> {
    return await this.studentChatService.getUnreadMessages(currentUser.sub);
  }
 
  /**
   * Get read messages for student
   * 
   * query {
   *   getStudentReadMessages(limit: 50) {
   *     id
   *     message
   *     subject
   *     createdAt
   *     isRead
   *   }
   * }
   */
  @Query(() => [ChatMessage], {
    description: 'Get all read messages for the current student',
  })
  async getStudentReadMessages(
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<ChatMessage[]> {
    return await this.studentChatService.getReadMessages(currentUser.sub, limit);
  }

 

  /**
   * Get unread count for student
   * 
   * query {
   *   getStudentUnreadCount
   * }
   */
  @Query(() => Int, {
    description: 'Get total unread message count for the current student',
  })
  async getStudentUnreadCount(
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<number> {
    return await this.studentChatService.getUnreadCount(currentUser.sub);
  }

  /**
   * Get unread count for a specific room
   * 
   * query {
   *   getStudentUnreadCountForRoom(chatRoomId: "room-uuid")
   * }
   */
 


  /**
   * Mark messages as read for student
   * 
   * mutation {
   *   markStudentMessagesAsRead(chatRoomId: "room-uuid")
   * }
   */
  @Mutation(() => Boolean, {
    description: 'Mark all messages in a chat room as read (student)',
  })
  async markStudentMessagesAsRead(
    @Args('chatRoomId') chatRoomId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<boolean> {
    return await this.studentChatService.markMessagesAsRead(
      currentUser,
      chatRoomId,
    );
  }
  
  /**
   * Mark single message as read (student)
   * 
   * mutation {
   *   markStudentMessageAsRead(messageId: "msg-uuid")
   * }
   */
  @Mutation(() => Boolean, {
    description: 'Mark a single message as read (student)',
  })
  async markStudentMessageAsRead(
    @Args('messageId') messageId: string,
    @ActiveUser() currentUser: ActiveUserData,
  ): Promise<boolean> {
    return await this.studentChatService.markMessageAsRead(
      currentUser.sub,
      messageId,
    );
  }

  /**
   * Delete student message
   * 
   * mutation {
   *   deleteStudentMessage(messageId: "msg-uuid")
   * }
   */
  // @Mutation(() => Boolean, {
  //   description: 'Delete a message sent by the current student',
  // })
  // async deleteStudentMessage(
  //   @Args('messageId') messageId: string,
  //   @ActiveUser() currentUser: ActiveUserData,
  // ): Promise<boolean> {
  //   return await this.studentChatService.deleteMessage(
  //     currentUser.sub,
  //     messageId,
  //   );
  // }

  // ==================== SUBSCRIPTIONS ====================

  /**
   * Subscribe to new messages (student)
   * 
   * subscription {
   *   studentMessageAdded {
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
    description: 'Subscribe to new messages in real-time (student)',
  })
  studentMessageAdded() {
    return this.pubSub.asyncIterator('messageAdded');
  }





}
import { Injectable, NotFoundException } from '@nestjs/common';
import { ChatProvider } from '../providers/chat.provider';
import { RedisChatProvider } from '../providers/redis-chat.provider';
import { ChatMessage } from '../entities/chat-message.entity';
import { ChatRoom } from '../entities/chat-room.entity';
import { SendMessageInput } from '../dtos/send-message.input';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatProvider: ChatProvider,
    private readonly redisChatProvider: RedisChatProvider,
  ) {}

  async sendMessageToStudent(
    teacherId: string,
    studentId: string,
    messageData: SendMessageInput,
  ): Promise<ChatMessage> {
    // Create or find chat room between teacher and student
    const chatRoom = await this.chatProvider.findOrCreateChatRoom(
      [teacherId, studentId],
      'TEACHER_STUDENT',
      `Teacher-Student Chat`,
    );

    // Create the message
    const message = await this.chatProvider.createMessage(
      teacherId,
      'TEACHER',
      chatRoom.id,
      messageData,
    );

    // Cache in Redis for real-time features
    await this.redisChatProvider.cacheMessage(message);

    return message;
  }

  async sendMessageToParent(
    teacherId: string,
    parentId: string,
    messageData: SendMessageInput,
  ): Promise<ChatMessage> {
    // Create or find chat room between teacher and parent
    const chatRoom = await this.chatProvider.findOrCreateChatRoom(
      [teacherId, parentId],
      'TEACHER_PARENT',
      `Teacher-Parent Chat`,
    );

    // Create the message
    const message = await this.chatProvider.createMessage(
      teacherId,
      'TEACHER',
      chatRoom.id,
      messageData,
    );

    // Cache in Redis
    await this.redisChatProvider.cacheMessage(message);

    return message;
  }

  async sendMessageToGrade(
    teacherId: string,
    gradeId: string,
    studentIds: string[],
    messageData: SendMessageInput,
  ): Promise<ChatMessage> {
    // Create group chat room for the grade
    const participantIds = [teacherId, ...studentIds];
    const chatRoom = await this.chatProvider.findOrCreateChatRoom(
      participantIds,
      'GRADE_GROUP',
      `Grade Group Chat`,
    );

    // Create the message
    const message = await this.chatProvider.createMessage(
      teacherId,
      'TEACHER',
      chatRoom.id,
      messageData,
    );

    // Cache in Redis
    await this.redisChatProvider.cacheMessage(message);

    return message;
  }

  async getChatHistory(
    userId: string,
    chatRoomId: string,
    limit?: number,
    offset?: number,
  ): Promise<ChatMessage[]> {
    return await this.chatProvider.getChatRoomMessages(
      chatRoomId,
      limit,
      offset,
    );
  }

  async getUserChats(userId: string): Promise<ChatRoom[]> {
    return await this.chatProvider.getUserChatRooms(userId);
  }

  async markAsRead(chatRoomId: string, userId: string): Promise<void> {
    await this.chatProvider.markMessagesAsRead(chatRoomId, userId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.chatProvider.getUnreadMessageCount(userId);
  }
}

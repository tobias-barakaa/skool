import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
    tenantId: string,
    studentId: string,
    messageData: SendMessageInput,
  ): Promise<ChatMessage> {
    const student = await this.chatProvider.getStudentById(studentId);

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (student.tenant_id !== tenantId) {
      throw new ForbiddenException('Unauthorized: Student is in a different tenant');
    }

    const chatRoom = await this.chatProvider.findOrCreateChatRoom(
      [teacherId, studentId],
      'TEACHER_STUDENT',
      `Teacher-Student Chat`,
    );

    const message = await this.chatProvider.createMessage(
      teacherId,
      'TEACHER',
      chatRoom.id,
      messageData,
    );

    await this.redisChatProvider.cacheMessage(message);

    return message;
  }

  async sendMessageToAllStudents(
    teacherId: string,
    tenantId: string,
    input: SendMessageInput,
  ): Promise<ChatMessage[]> {
    const students = await this.chatProvider.getAllStudentsByTenant(tenantId);

    const messages: ChatMessage[] = [];

    for (const student of students) {
      const message = await this.sendMessageToStudent(
        teacherId,
        tenantId,
        student.id,
        input,
      );
      messages.push(message);
    }

    return messages;
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

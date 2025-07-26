import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ChatProvider } from '../providers/chat.provider';
import { RedisChatProvider } from '../providers/redis-chat.provider';
import { ChatMessage } from '../entities/chat-message.entity';
import { ChatRoom } from '../entities/chat-room.entity';
import { BroadcastMessageInput, SendMessageInput } from '../dtos/send-message.input';

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
      throw new ForbiddenException(
        'Unauthorized: Student is in a different tenant',
      );
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
    input: BroadcastMessageInput,
  ): Promise<ChatMessage[]> {
    const students = await this.chatProvider.getAllStudentsByTenant(tenantId);

    const messages: ChatMessage[] = [];

    for (const student of students) {
      try {
        const studentInput: SendMessageInput = {
          ...input,
          recipientId: student.id, // <- inject dynamically
        };

        const message = await this.sendMessageToStudent(
          teacherId,
          tenantId,
          student.id,
          studentInput,
        );

        if (message) {
          messages.push(message);
        }
      } catch (error) {
        console.warn(`Skipping student ${student.id}: ${error.message}`);
        continue;
      }
    }

    return messages;
  }

  async sendMessageToParent(
    teacherId: string,
    tenantId: string,
    parentId: string,
    messageData: SendMessageInput,
  ): Promise<ChatMessage> {
    // Create or find chat room between teacher and parent

    const parent = await this.chatProvider.getParentById(parentId);

    if (!parent) {
      throw new NotFoundException('Student not found');
    }

    if (parent.tenantId !== tenantId) {
      throw new ForbiddenException(
        'Unauthorized: Student is in a different tenant',
      );
    }
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

  async sendMessageToAllParents(
    teacherId: string,
    tenantId: string,
    input: BroadcastMessageInput, // This does NOT contain recipientId
  ): Promise<ChatMessage[]> {
    const parents = await this.chatProvider.getAllParentsByTenant(tenantId);

    const messages: ChatMessage[] = [];

    for (const parent of parents) {
      try {
        const parentInput: SendMessageInput = {
          ...input,
          recipientId: parent.id, // Inject recipientId dynamically
        };

        const message = await this.sendMessageToParent(
          teacherId,
          tenantId,
          parent.id,
          parentInput,
        );

        if (message) {
          messages.push(message);
        }
      } catch (error) {
        console.warn(`Skipping parent ${parent.id}: ${error.message}`);
        continue;
      }
    }

    return messages;
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

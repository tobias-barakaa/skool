import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RedisChatProvider } from 'src/messaging/providers/redis-chat.provider';
import { GetChatRoomsArgs } from './dtos/get-chat-rooms.args';
import { ChatRoomsResponse } from './dtos/chat-rooms-response.dto';
import { GetMessagesArgs } from './dtos/get-messages.args';
import { MessagesResponse } from './dtos/messages-response.dto';
import { SendMessageToTeacherInput } from './dtos/send-message.input';
import { ChatMessage } from 'src/messaging/entities/chat-message.entity';
import { StudentChatProvider } from './providers/chat.provider';

@Injectable()
export class StudentChatService {
  constructor(
    private readonly chatProvider: StudentChatProvider,
    private readonly redisChatProvider: RedisChatProvider,
  ) {}

  async getStudentChatRooms(
    userId: string,
    tenantId: string,
    args: GetChatRoomsArgs,
  ): Promise<ChatRoomsResponse> {
    try {
      // Verify student exists
      const student = await this.chatProvider.getStudentByUserId(userId, tenantId);
      if (!student) {
        throw new NotFoundException('Student not found for this user');
      }

      // Fetch chat rooms
      const { chatRooms, total } = await this.chatProvider.getChatRoomsByUserId(
        userId,
        tenantId,
        'TEACHER_STUDENT',
        args,
      );

      const limit = args.limit || 10;
      const currentPage = Math.floor((args.offset || 0) / limit) + 1;
      const totalPages = Math.ceil(total / limit);

      return {
        chatRooms,
        total,
        totalPages,
        currentPage,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error.message || 'Failed to fetch chat rooms');
    }
  }

  async getMessages(
    userId: string,
    tenantId: string,
    args: GetMessagesArgs,
  ): Promise<MessagesResponse> {
    const student = await this.chatProvider.getStudentByUserId(userId, tenantId);
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return await this.chatProvider.getMessages(userId, tenantId, args);
  }

  async sendMessageToTeacher(
    studentUserId: string,
    tenantId: string,
    input: SendMessageToTeacherInput,
  ): Promise<ChatMessage> {
    // Verify student exists
    const student = await this.chatProvider.getStudentByUserId(
      studentUserId,
      tenantId,
    );
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Get teacher by ID and convert to user_id
    const teacher = await this.chatProvider.getTeacherById(
      input.recipientId,
      tenantId,
    );
    if (!teacher) {
      throw new NotFoundException('Teacher not found in this tenant');
    }

    const teacherUserId = teacher.user_id;

    // Create or find chat room
    const chatRoom = await this.chatProvider.findOrCreateChatRoom(
      [studentUserId, teacherUserId],
      'TEACHER_STUDENT',
      'Teacher-Student Chat',
    );

    // Create message
    const messageData = await this.chatProvider.createMessage(
      studentUserId,
      'STUDENT',
      chatRoom.id,
      input,
    );

    // Convert to ChatMessage entity format
    const message: ChatMessage = {
      id: messageData.id,
      senderId: messageData.senderId,
      senderType: messageData.senderType,
      subject: messageData.subject,
      message: messageData.message,
      imageUrl: messageData.imageUrl,
      chatRoomId: messageData.chatRoomId,
      isRead: messageData.isRead,
      createdAt: messageData.createdAt,
      chatRoom: null as any,
    };

    await this.redisChatProvider.cacheMessage(message);

    return message;
  }

  async markChatAsRead(chatRoomId: string, userId: string): Promise<boolean> {
    await this.chatProvider.markMessagesAsRead(chatRoomId, userId);
    return true;
  }
}
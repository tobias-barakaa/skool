import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ChatProvider } from './providers/chat.provider';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { GetChatRoomsArgs } from './dtos/get-chat-rooms.args';
import { ChatMessage, ChatRoomsResponse, MessagesResponse } from './dtos/chat-response.dto';
import { GetMessagesArgs } from './dtos/get-messages.args';
import { SendMessageToTeacherInput } from './dtos/send-message.input';

@Injectable()
export class ChatService {
  constructor(private readonly chatProvider: ChatProvider) {}

  async getStudentChatRooms(
    student: ActiveUserData,
    args: GetChatRoomsArgs,
  ): Promise<ChatRoomsResponse> {
    try {
      // Verify student exists
      const studentRecord = await this.chatProvider.getStudentById(
        student.sub,
        student.tenantId,
      );

      if (!studentRecord) {
        throw new NotFoundException('Student not found');
      }

      const { chatRooms, total } = await this.chatProvider.getStudentChatRooms(
        student.sub,
        student.tenantId,
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
      console.error('Error in getStudentChatRooms:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to fetch chat rooms');
    }
  }

  async getMessages(
    student: ActiveUserData,
    args: GetMessagesArgs,
  ): Promise<MessagesResponse> {
    try {
      // Verify student exists
      const studentRecord = await this.chatProvider.getStudentById(
        student.sub,
        student.tenantId,
      );

      if (!studentRecord) {
        throw new NotFoundException('Student not found');
      }

      return await this.chatProvider.getMessages(
        student.sub,
        student.tenantId,
        args,
      );
    } catch (error) {
      console.error('Error in getMessages:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to fetch messages');
    }
  }

  async sendMessageToTeacher(
    student: ActiveUserData,
    input: SendMessageToTeacherInput,
  ): Promise<ChatMessage> {
    try {
      // Verify student exists
      const studentRecord = await this.chatProvider.getStudentById(
        student.sub,
        student.tenantId,
      );

      if (!studentRecord) {
        throw new NotFoundException('Student not found');
      }

      return await this.chatProvider.sendMessageToTeacher(
        student.sub,
        student.tenantId,
        input,
      );
    } catch (error) {
      console.error('Error in sendMessageToTeacher:', error);
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Failed to send message');
    }
  }
}

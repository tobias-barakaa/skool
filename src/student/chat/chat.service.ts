import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { GetChatRoomsArgs } from './dtos/get-chat-rooms.args';
import { ChatMessageInput, ChatRoomsResponse, MessagesResponse } from './dtos/chat-response.dto';
import { GetMessagesArgs } from './dtos/get-messages.args';
import { SendMessageToTeacherInput } from './dtos/send-message.input';
import { StudentChatProvider } from './providers/chat.provider';
import { ChatMessage } from 'src/messaging/entities/chat-message.entity';
import { RedisChatProvider } from 'src/messaging/providers/redis-chat.provider';



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
      // Verify this user is a student in this tenant
      const student = await this.chatProvider.getStudentByUserId(
        userId,
        tenantId,
      );

      if (!student) {
        throw new NotFoundException('Student not found for this user');
      }

      // Fetch chat rooms using user_id
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
      console.error('Error in getStudentChatRooms:', error);
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(
        error.message || 'Failed to fetch chat rooms',
      );
    }
  }

  async getMessages(
    userId: string,
    tenantId: string,
    args: GetMessagesArgs,
  ): Promise<MessagesResponse> {
    // Verify student exists
    const student = await this.chatProvider.getStudentByUserId(
      userId,
      tenantId,
    );
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

    // input.recipientId is TEACHER_ID, need to get their user_id
    const teacher = await this.chatProvider.getTeacherById(
      input.recipientId,
      tenantId,
    );
    if (!teacher) {
      throw new NotFoundException('Teacher not found in this tenant');
    }

    // Now use user_ids for chat operations
    const teacherUserId = teacher.user_id;

    // Create or find chat room using user_ids
    const chatRoom = await this.chatProvider.findOrCreateChatRoom(
      [studentUserId, teacherUserId],
      'TEACHER_STUDENT',
      'Teacher-Student Chat',
    );

    // Create message
    const message = await this.chatProvider.createMessage(
      studentUserId,
      'STUDENT',
      chatRoom.id,
      input,
    );

    await this.redisChatProvider.cacheMessage(message);

    return message;
  }
  // async getStudentChatRooms(
  //   user: ActiveUserData,
  //   args: GetChatRoomsArgs,
  // ): Promise<ChatRoomsResponse> {
  //   try {
  //     // Step 1: find the student's record using the logged-in user id
  //     const studentRecord = await this.chatProvider.getStudentByUserId(
  //       user.sub,
  //       user.tenantId,
  //     );

  //     console.log(studentRecord,'this is studentrecode....')

  //     if (!studentRecord) {
  //       throw new NotFoundException('Student not found for this user');
  //     }

  //     // Step 2: use the student's actual ID in the chat provider call
  //     const { chatRooms, total } = await this.chatProvider.getStudentChatRooms(
  //       studentRecord.id,
  //       user.tenantId,
  //       args,
  //     );

  //     const limit = args.limit || 10;
  //     const currentPage = Math.floor((args.offset || 0) / limit) + 1;
  //     const totalPages = Math.ceil(total / limit);

  //     return {
  //       chatRooms,
  //       total,
  //       totalPages,
  //       currentPage,
  //     };
  //   } catch (error) {
  //     console.error('Error in getStudentChatRooms:', error);
  //     if (error instanceof NotFoundException) throw error;
  //     throw new BadRequestException(
  //       error.message || 'Failed to fetch chat rooms',
  //     );
  //   }
  // }

  // async getStudentChatRooms(
  //   student: ActiveUserData,
  //   args: GetChatRoomsArgs,
  // ): Promise<ChatRoomsResponse> {
  //   try {
  //     // Verify student exists
  //     const studentRecord = await this.chatProvider.getStudentById(
  //       student.sub,
  //       student.tenantId,
  //     );

  //     if (!studentRecord) {
  //       throw new NotFoundException('Student not found');
  //     }

  //     const { chatRooms, total } = await this.chatProvider.getStudentChatRooms(
  //       student.sub,
  //       student.tenantId,
  //       args,
  //     );

  //     const limit = args.limit || 10;
  //     const currentPage = Math.floor((args.offset || 0) / limit) + 1;
  //     const totalPages = Math.ceil(total / limit);

  //     return {
  //       chatRooms,
  //       total,
  //       totalPages,
  //       currentPage,
  //     };
  //   } catch (error) {
  //     console.error('Error in getStudentChatRooms:', error);
  //     if (error instanceof NotFoundException) {
  //       throw error;
  //     }
  //     throw new BadRequestException(error.message || 'Failed to fetch chat rooms');
  //   }
  // }

  // async getMessages(
  //   userId: string,
  //   tenantId: string,
  //   args: GetMessagesArgs,
  // ): Promise<MessagesResponse> {
  //   // Verify student exists
  //   const student = await this.chatProvider.getStudentByUserId(
  //     userId,
  //     tenantId,
  //   );
  //   if (!student) {
  //     throw new NotFoundException('Student not found');
  //   }

  //   return await this.chatProvider.getMessages(userId, tenantId, args);
  // }

  // async sendMessageToTeacher(
  //   userId: string,
  //   tenantId: string,
  //   input: SendMessageToTeacherInput,
  // ): Promise<ChatMessage> {
  //   // Verify student exists
  //   const student = await this.chatProvider.getStudentByUserId(
  //     userId,
  //     tenantId,
  //   );
  //   if (!student) {
  //     throw new NotFoundException('Student not found');
  //   }

  //   // Verify teacher exists and is in same tenant
  //   const teacher = await this.chatProvider.getTeacherByUserId(
  //     input.recipientId,
  //     tenantId,
  //   );
  //   if (!teacher) {
  //     throw new NotFoundException('Teacher not found in this tenant');
  //   }

  //   // Create or find chat room using user_ids
  //   const chatRoom = await this.chatProvider.findOrCreateChatRoom(
  //     [userId, input.recipientId],
  //     'TEACHER_STUDENT',
  //     'Teacher-Student Chat',
  //   );

  //   // Create message
  //   const message = await this.chatProvider.createMessage(
  //     userId,
  //     'STUDENT',
  //     chatRoom.id,
  //     input,
  //   );

  //   await this.redisChatProvider.cacheMessage(message);

  //   return message;
  // }

  // async getMessages(
  //   student: ActiveUserData,
  //   args: GetMessagesArgs,
  // ): Promise<MessagesResponse> {
  //   try {
  //     // Verify student exists
  //     const studentRecord = await this.chatProvider.getStudentById(
  //       student.sub,
  //       student.tenantId,
  //     );

  //     if (!studentRecord) {
  //       throw new NotFoundException('Student not found');
  //     }

  //     return await this.chatProvider.getMessages(
  //       student.sub,
  //       student.tenantId,
  //       args,
  //     );
  //   } catch (error) {
  //     console.error('Error in getMessages:', error);
  //     if (error instanceof NotFoundException) {
  //       throw error;
  //     }
  //     throw new BadRequestException(
  //       error.message || 'Failed to fetch messages',
  //     );
  //   }
  // }

  // async sendMessageToTeacher(
  //   student: ActiveUserData,
  //   input: SendMessageToTeacherInput,
  // ): Promise<ChatMessageInput> {
  //   try {
  //     // Verify student exists
  //     const studentRecord = await this.chatProvider.getStudentById(
  //       student.sub,
  //       student.tenantId,
  //     );

  //     if (!studentRecord) {
  //       throw new NotFoundException('Student not found');
  //     }

  //     return await this.chatProvider.sendMessageToTeacher(
  //       student.sub,
  //       student.tenantId,
  //       input,
  //     );
  //   } catch (error) {
  //     console.error('Error in sendMessageToTeacher:', error);
  //     if (
  //       error instanceof NotFoundException ||
  //       error instanceof ForbiddenException
  //     ) {
  //       throw error;
  //     }
  //     throw new BadRequestException(error.message || 'Failed to send message');
  //   }
  // }
}

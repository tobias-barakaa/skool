import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { ChatRoom } from '../entities/chat-room.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { RedisChatProvider } from './redis-chat.provider';
import { Student } from 'src/admin/student/entities/student.entity';
import { Teacher } from 'src/admin/teacher/entities/teacher.entity';
import { ParentStudent } from 'src/admin/parent/entities/parent-student.entity';
import { Parent } from 'src/admin/parent/entities/parent.entity';
import { BroadcastMessageInput, SendMessageInput } from '../dtos/send-message.input';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(ParentStudent)
    private readonly parentStudentRepository: Repository<ParentStudent>,
    private readonly redisChatProvider: RedisChatProvider,
    private readonly dataSource: DataSource,
  ) {}

  
  /**
   * Send message from teacher to a specific student
   */
  async sendMessageToStudent(
    teacherUserId: string,
    tenantId: string,
    input: SendMessageInput,
  ): Promise<ChatMessage> {
    // Get teacher by user_id
    const teacher = await this.teacherRepository.findOne({
      where: { user: { id: teacherUserId }, tenantId },
    });

    console.log(teacher, 'this is teacher.....')

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Get student and their user_id
    const student = await this.studentRepository.findOne({
      where: { id: input.recipientId, tenant_id: tenantId },
      relations: ['user'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Create or get chat room between teacher and student
    const chatRoom = await this.getOrCreateChatRoom(
      `teacher-student-${teacher.id}-${student.id}`,
      'DIRECT',
      [teacherUserId, student.user_id],
      tenantId,
    );

    // Create message
    const message = this.chatMessageRepository.create({
      senderId: teacherUserId,
      senderType: 'TEACHER',
      subject: input.subject,
      message: input.message,
      imageUrl: input.imageUrl,
      chatRoomId: chatRoom.id,
      isRead: false,
    });

    const savedMessage = await this.chatMessageRepository.save(message);


// Reload with relations
const found = await this.chatMessageRepository.findOne({
  where: { id: savedMessage.id },
  relations: ['chatRoom'],
});

const messageWithRoom: ChatMessage = found ?? Object.assign(savedMessage, { chatRoom });

// Cache in Redis
await this.redisChatProvider.cacheMessage(messageWithRoom);

// Track unread count
await this.redisChatProvider.incrementUnreadCount(student.user_id, chatRoom.id);

return messageWithRoom;

  }

  /**
   * Send message from teacher to a specific parent
   */
  async sendMessageToParent(
    teacherUserId: string,
    tenantId: string,
    input: SendMessageInput,
  ): Promise<ChatMessage> {
    const teacher = await this.teacherRepository.findOne({
      where: { user: { id: teacherUserId }, tenantId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Get parent and their user_id
    const parent = await this.parentRepository.findOne({
      where: { id: input.recipientId, tenantId },
      relations: ['user'],
    });

    if (!parent || !parent.user) {
      throw new NotFoundException('Parent not found or not linked to user');
    }

    const chatRoom = await this.getOrCreateChatRoom(
      `teacher-parent-${teacher.id}-${parent.id}`,
      'DIRECT',
      [teacherUserId, parent.user.id],
      tenantId,
    );

    const message = this.chatMessageRepository.create({
      senderId: teacherUserId,
      senderType: 'TEACHER',
      subject: input.subject,
      message: input.message,
      imageUrl: input.imageUrl,
      chatRoomId: chatRoom.id,
      isRead: false,
    });

    const savedMessage = await this.chatMessageRepository.save(message);
    await this.redisChatProvider.cacheMessage(savedMessage);
    await this.redisChatProvider.incrementUnreadCount(parent.user.id, chatRoom.id);

    return savedMessage;
  }



  async deleteMessage(
    userId: string,
    tenantId: string,
    messageId: string,
    options?: { hard?: boolean },
  ): Promise<boolean> {
    // 1️⃣ Find message with room
    const message = await this.chatMessageRepository.findOne({
      where: { id: messageId },
      relations: ['chatRoom'],
    });
  
    if (!message) {
      throw new NotFoundException('Message not found');
    }
  
    // 2️⃣ Check that the current user is allowed to delete it
    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }
  
    // 3️⃣ Optionally hard delete
    if (options?.hard) {
      await this.chatMessageRepository.delete({ id: messageId });
  
      // Clean Redis cache
      await this.redisChatProvider.removeCachedMessage(messageId);
      return true;
    }
  
    // 4️⃣ Otherwise mark as deleted (soft delete)
    await this.chatMessageRepository.update(
      { id: messageId },
      { deleted: true },
    );
  
    // Optionally remove from Redis visible list
    await this.redisChatProvider.markMessageDeleted(messageId, message.chatRoomId);
  
    return true;
  }
      
  /**
   * Broadcast message to all students in tenant
   */
  async broadcastToAllStudents(
    teacherUserId: string,
    tenantId: string,
    input: BroadcastMessageInput,
  ): Promise<ChatMessage[]> {
    const teacher = await this.teacherRepository.findOne({
      where: { user: { id: teacherUserId }, tenantId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const students = await this.studentRepository.find({
      where: { tenant_id: tenantId, isActive: true },
      relations: ['user'],
    });

    if (students.length === 0) {
      throw new BadRequestException('No active students found');
    }

    const messages: ChatMessage[] = [];

    for (const student of students) {
      try {
        const chatRoom = await this.getOrCreateChatRoom(
          `teacher-student-${teacher.id}-${student.id}`,
          'DIRECT',
          [teacherUserId, student.user_id],
          tenantId,
        );

        const message = this.chatMessageRepository.create({
          senderId: teacherUserId,
          senderType: 'TEACHER',
          subject: input.subject,
          message: input.message,
          imageUrl: input.imageUrl,
          chatRoomId: chatRoom.id,
          isRead: false,
        });

        const savedMessage = await this.chatMessageRepository.save(message);
        await this.redisChatProvider.cacheMessage(savedMessage);
        await this.redisChatProvider.incrementUnreadCount(student.user_id, chatRoom.id);
        
        messages.push(savedMessage);
      } catch (error) {
        this.logger.error(`Failed to send message to student ${student.id}:`, error);
      }
    }

    return messages;
  }

  /**
   * Broadcast message to all parents in tenant
   */
  async broadcastToAllParents(
    teacherUserId: string,
    tenantId: string,
    input: BroadcastMessageInput,
  ): Promise<ChatMessage[]> {
    const teacher = await this.teacherRepository.findOne({
      where: { user: { id: teacherUserId }, tenantId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const parents = await this.parentRepository.find({
      where: { tenantId, isActive: true },
      relations: ['user'],
    });

    if (parents.length === 0) {
      throw new BadRequestException('No active parents found');
    }

    const messages: ChatMessage[] = [];

    for (const parent of parents) {
      if (!parent.user) continue;

      try {
        const chatRoom = await this.getOrCreateChatRoom(
          `teacher-parent-${teacher.id}-${parent.id}`,
          'DIRECT',
          [teacherUserId, parent.user.id],
          tenantId,
        );

        const message = this.chatMessageRepository.create({
          senderId: teacherUserId,
          senderType: 'TEACHER',
          subject: input.subject,
          message: input.message,
          imageUrl: input.imageUrl,
          chatRoomId: chatRoom.id,
          isRead: false,
        });

        const savedMessage = await this.chatMessageRepository.save(message);
        await this.redisChatProvider.cacheMessage(savedMessage);
        await this.redisChatProvider.incrementUnreadCount(parent.user.id, chatRoom.id);
        
        messages.push(savedMessage);
      } catch (error) {
        this.logger.error(`Failed to send message to parent ${parent.id}:`, error);
      }
    }

    return messages;
  }


  async getChatHistory(
    userId: string,
    chatRoomId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ChatMessage[]> {
    // 1. Verify that the user is a participant
    const room = await this.chatRoomRepository.findOne({
      where: { id: chatRoomId },
    });
  
    if (!room || !room.participantIds.includes(userId)) {
      throw new NotFoundException('Chat room not found or access denied');
    }
  
    // 2. Try cache first (only when we want the first page)
    if (offset === 0) {
      const cachedMessages = await this.redisChatProvider.getRecentMessages(chatRoomId);
      if (cachedMessages.length > 0) {
        return cachedMessages.slice(0, limit).map(msg => ({
          ...msg,
          createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
          chatRoom: room, // <-- guarantees non-nullable field
        }));
      }
    }
  
    // 3. Fallback to database
    const messages = await this.chatMessageRepository.find({
      where: { chatRoomId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['chatRoom'], // TypeORM will populate chatRoom
    });
  
    // 4. Ensure createdAt is a Date instance
    return messages.map(msg => ({
      ...msg,
      createdAt: msg.createdAt instanceof Date ? msg.createdAt : new Date(msg.createdAt),
    }));
  }



  /**
   * Mark messages as read
   */
  async markMessagesAsRead(
    userId: string,
    chatRoomId: string,
  ): Promise<boolean> {
    const room = await this.chatRoomRepository.findOne({
      where: { id: chatRoomId },
    });

    if (!room || !room.participantIds.includes(userId)) {
      throw new NotFoundException('Chat room not found or access denied');
    }

    await this.chatMessageRepository.update(
      { chatRoomId, isRead: false, senderId: In([...room.participantIds.filter(id => id !== userId)]) },
      { isRead: true },
    );

    // Clear unread count in Redis
    await this.redisChatProvider.clearUnreadCount(userId, chatRoomId);

    return true;
  }

  /**
   * Get unread message count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await this.redisChatProvider.getTotalUnreadCount(userId);
  }

  /**
   * Get all chat rooms for a user
   */
 // File: student-chat.service.ts or similar
async getUserChatRooms(userId: string): Promise<ChatRoom[]> {
  const rooms = await this.chatRoomRepository
    .createQueryBuilder('room')
    .leftJoinAndSelect('room.messages', 'message', 'message.deleted = false') // <-- ADD THIS LINE
    .where('room.participantIds LIKE :userIdPattern', {
      userIdPattern: `%${userId}%`,
    })
    .orderBy('room.updatedAt', 'DESC')
    .addOrderBy('message.createdAt', 'ASC') // <-- ADD THIS LINE for message ordering
    .getMany();

  // Optional: Filter rooms with no messages, depending on your business logic.
  // The student's side had this: return rooms.filter(room => room.messages.length > 0);
  // If you want teachers to see rooms even without messages, return rooms directly.
  return rooms;
}

  
  

  /**
   * Get or create chat room
   */
  private async getOrCreateChatRoom(
    name: string,
    type: string,
    participantIds: string[],
    tenantId: string,
  ): Promise<ChatRoom> {
    let room = await this.chatRoomRepository.findOne({
      where: { name },
    });

    if (!room) {
      room = this.chatRoomRepository.create({
        name,
        type,
        participantIds,
      });
      room = await this.chatRoomRepository.save(room);
    }

    return room;
  }

  /**
   * Send message from parent to teacher about their child
   */
  async sendMessageFromParentToTeacher(
    parentUserId: string,
    tenantId: string,
    input: SendMessageInput & { studentId: string },
  ): Promise<ChatMessage> {
    const parent = await this.parentRepository.findOne({
      where: { user: { id: parentUserId }, tenantId },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    // Verify parent-student relationship
    const relationship = await this.parentStudentRepository.findOne({
      where: { parentId: parent.id, studentId: input.studentId, tenantId },
    });

    if (!relationship) {
      throw new BadRequestException('You are not linked to this student');
    }

    const teacher = await this.teacherRepository.findOne({
      where: { id: input.recipientId, tenantId },
      relations: ['user'],
    });

    if (!teacher || !teacher.user) {
      throw new NotFoundException('Teacher not found');
    }

    const chatRoom = await this.getOrCreateChatRoom(
      `parent-teacher-${parent.id}-${teacher.id}`,
      'DIRECT',
      [parentUserId, teacher.user.id],
      tenantId,
    );

    const message = this.chatMessageRepository.create({
      senderId: parentUserId,
      senderType: 'PARENT',
      subject: input.subject,
      message: input.message,
      imageUrl: input.imageUrl,
      chatRoomId: chatRoom.id,
      isRead: false,
    });

    const savedMessage = await this.chatMessageRepository.save(message);
    await this.redisChatProvider.cacheMessage(savedMessage);
    await this.redisChatProvider.incrementUnreadCount(teacher.user.id, chatRoom.id);

    return savedMessage;
  }
}
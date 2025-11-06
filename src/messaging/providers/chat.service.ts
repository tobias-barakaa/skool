import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource, Not } from 'typeorm';
import { ChatRoom } from '../entities/chat-room.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { RedisChatProvider } from './redis-chat.provider';
import { Student } from 'src/admin/student/entities/student.entity';
import { Teacher } from 'src/admin/teacher/entities/teacher.entity';
import { ParentStudent } from 'src/admin/parent/entities/parent-student.entity';
import { Parent } from 'src/admin/parent/entities/parent.entity';
import { BroadcastMessageInput, BroadcastToGradeLevelsInput, SendMessageFromTeacherToParentInput, SendMessageInput } from '../dtos/send-message.input';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';
import { NotFound } from '@aws-sdk/client-s3';



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
    user: ActiveUserData,
    input: SendMessageInput,
  ): Promise<ChatMessage> {
    const tenantId = user.tenantId;
    if(!tenantId) {
      throw new NotFoundException("Tenant not found");
    }
    const teacher = await this.teacherRepository.findOne({
      where: { user: { id: teacherUserId }, tenantId: user.tenantId },
    });

    console.log(teacher, 'this is teacher.....')

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Get student and their user_id
    const student = await this.studentRepository.findOne({
      where: { id: input.recipientId, tenant_id: user.tenantId },
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
    user: ActiveUserData,
    input: SendMessageFromTeacherToParentInput,
  ): Promise<ChatMessage> {
    // Get teacher by user_id
    const teacherUserId = user.sub;
    const tenantId = user.tenantId;
    if(!tenantId) {
      throw new NotFoundException("Tenant not found");
    }
    const teacher = await this.teacherRepository.findOne({
      where: { user: { id: teacherUserId }, tenantId },
      relations: ['user'],
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Get parent by ID
    const parent = await this.parentRepository.findOne({
      where: { id: input.recipientId, tenantId },
      relations: ['user'],
    });

    if (!parent || !parent.user) {
      throw new NotFoundException('Parent not found or not linked to user');
    }

    // Verify teacher actually teaches this parent's child (optional but good)
    const relationship = await this.parentStudentRepository.findOne({
      where: { parentId: parent.id, studentId: input.studentId, tenantId },
    });

    if (!relationship) {
      throw new BadRequestException('This parent is not linked to the selected student');
    }

    // Generate consistent room name
    const participants = [teacher.id, parent.id].sort((a, b) => a.localeCompare(b));
    const roomName = `teacher-parent-${participants[0]}-${participants[1]}`;

    // Create or fetch chatroom
    const chatRoom = await this.getOrCreateChatRoom(
      roomName,
      'DIRECT',
      [teacherUserId, parent.user.id],
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

    const found = await this.chatMessageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['chatRoom'],
    });

    const messageWithRoom = found ?? Object.assign(savedMessage, { chatRoom });

    // Cache and increment unread count for parent
    await this.redisChatProvider.cacheMessage(messageWithRoom);
    await this.redisChatProvider.incrementUnreadCount(parent.user.id, chatRoom.id);

    return messageWithRoom;
  }




  async deleteMessage(
    user: ActiveUserData,
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
    if (message.senderId !== user.sub) {
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
    currentUser: ActiveUserData,
    input: BroadcastMessageInput,
  ): Promise<ChatMessage[]> {
    const teacherUserId = currentUser.sub;
    const tenantId = currentUser.tenantId;
    if(!tenantId) {
      throw new NotFoundException("Tenant not found");
    }
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
    currentUser: ActiveUserData,
    input: BroadcastMessageInput,
  ): Promise<ChatMessage[]> {
    const teacherUserId = currentUser.sub;
    const tenantId = currentUser.tenantId;
    if (!tenantId) {
      throw new NotFoundException("Tenant not found");
    }
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
    currentUser: ActiveUserData,
    chatRoomId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ChatMessage[]> {
    // 1. Verify that the user is a participant
    const room = await this.chatRoomRepository.findOne({
      where: { id: chatRoomId },
    });
  
    if (!room || !room.participantIds.includes(currentUser.sub)) {
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
    currentUser: ActiveUserData,
    chatRoomId: string,
  ): Promise<boolean> {
    const userId = currentUser.sub;
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
    user: ActiveUserData,
    input: SendMessageInput & { studentId: string },
  ): Promise<ChatMessage> {
    const parentUserId = user.sub;
    const tenantId = user.tenantId;
    if(!tenantId) {
      throw new NotFoundException("Tenant Not Found")
    }
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




  async broadcastToEntireSchool(
    user: ActiveUserData,
    input: BroadcastMessageInput,
  ): Promise<ChatMessage[]> {
    const teacherUserId = user.sub;
    const tenantId = user.tenantId;

    if(!tenantId) {
      throw new NotFoundException("Tenant not found");
    }

    const teacher = await this.teacherRepository.findOne({
      where: { user: { id: teacherUserId }, tenantId },
    });
  
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }
  
    // Get ALL students in the tenant regardless of grade
    const students = await this.studentRepository.find({
      where: { tenant_id: tenantId, isActive: true },
      relations: ['user'],
    });
  
    if (students.length === 0) {
      throw new BadRequestException('No active students found in school');
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
  
    this.logger.log(`Broadcast sent to ${messages.length} students in entire school`);
    return messages;
  }
  
  /**
   * Broadcast to all school parents
   */
  async broadcastToAllSchoolParents(
    user: ActiveUserData,
    input: BroadcastMessageInput,
  ): Promise<ChatMessage[]> {
    const teacherUserId = user.sub;
    const tenantId = user.tenantId;
    if (!tenantId) {
      throw new NotFoundException("Tenant not found");
    }
    const teacher = await this.teacherRepository.findOne({
      where: { user: { id: teacherUserId }, tenantId },
    });
  
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }
  
    // Get ALL parents in the tenant
    const parents = await this.parentRepository.find({
      where: { tenantId, isActive: true },
      relations: ['user'],
    });
  
    if (parents.length === 0) {
      throw new BadRequestException('No active parents found in school');
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
  
    this.logger.log(`Broadcast sent to ${messages.length} parents in entire school`);
    return messages;
  }
  
  /**
   * Broadcast to specific grade levels (students)
   */
  async broadcastToGradeLevels(
    user: ActiveUserData,
    input: BroadcastToGradeLevelsInput,
  ): Promise<ChatMessage[]> {
    const teacherUserId = user.sub;
    const tenantId = user.tenantId;
    if(!tenantId) {
      throw new NotFoundException("Tenant not found");
    }
    const teacher = await this.teacherRepository.findOne({
      where: { user: { id: teacherUserId }, tenantId },
    });
  
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }
  
    // Get students in specified grade levels
    const students = await this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('student.grade', 'grade')
      .where('student.tenant_id = :tenantId', { tenantId })
      .andWhere('student.isActive = :isActive', { isActive: true })
      .andWhere('grade.id IN (:...gradeLevelIds)', { 
        gradeLevelIds: input.gradeLevelIds 
      })
      .getMany();
  
    if (students.length === 0) {
      throw new BadRequestException('No active students found in specified grade levels');
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
  
    this.logger.log(`Broadcast sent to ${messages.length} students in grade levels`);
    return messages;
  }
  
  /**
   * Broadcast to parents of specific grade levels
   */
  async broadcastToGradeLevelParents(
    user: ActiveUserData,
    input: BroadcastToGradeLevelsInput,
  ): Promise<ChatMessage[]> {
    const teacherUserId = user.sub;
    const tenantId = user.tenantId;
    if (!tenantId) {
      throw new NotFoundException("Tenant not found");
    }
    const teacher = await this.teacherRepository.findOne({
      where: { user: { id: teacherUserId }, tenantId },
    });
  
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }
  
    // Get students in specified grade levels, then their parents
    const students = await this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.grade', 'grade')
      .where('student.tenant_id = :tenantId', { tenantId })
      .andWhere('student.isActive = :isActive', { isActive: true })
      .andWhere('grade.id IN (:...gradeLevelIds)', { 
        gradeLevelIds: input.gradeLevelIds 
      })
      .getMany();
  
    if (students.length === 0) {
      throw new BadRequestException('No students found in specified grade levels');
    }
  
    // Get parent-student relationships for these students
    const studentIds = students.map(s => s.id);
    const parentStudentRelations = await this.parentStudentRepository.find({
      where: { 
        studentId: In(studentIds),
        tenantId 
      },
      relations: ['parent', 'parent.user'],
    });
  
    // Get unique parents
    const uniqueParents = new Map<string, Parent>();
    parentStudentRelations.forEach(rel => {
      if (rel.parent && rel.parent.user && rel.parent.isActive) {
        uniqueParents.set(rel.parent.id, rel.parent);
      }
    });
  
    if (uniqueParents.size === 0) {
      throw new BadRequestException('No active parents found for specified grade levels');
    }
  
    const messages: ChatMessage[] = [];
  
    for (const parent of uniqueParents.values()) {
      try {
        const parentUserId = parent.user?.id;
        if (!parentUserId) {
          this.logger.warn(`Parent ${parent.id} has no linked user, skipping`);
          continue;
        }

        const chatRoom = await this.getOrCreateChatRoom(
          `teacher-parent-${teacher.id}-${parent.id}`,
          'DIRECT',
          [teacherUserId, parentUserId],
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
        await this.redisChatProvider.incrementUnreadCount(parentUserId, chatRoom.id);
        
        messages.push(savedMessage);
      } catch (error) {
        this.logger.error(`Failed to send message to parent ${parent.id}:`, error);
      }
    }
  
    this.logger.log(`Broadcast sent to ${messages.length} parents in grade levels`);
    return messages;
  }
  
  /**
   * Get all unread messages for a user
   */
  async getUnreadMessages(userId: string): Promise<ChatMessage[]> {
    // Get all chat rooms where user is a participant
    const rooms = await this.chatRoomRepository
      .createQueryBuilder('room')
      .where('room.participantIds LIKE :userIdPattern', {
        userIdPattern: `%${userId}%`,
      })
      .getMany();
  
    const roomIds = rooms.map(r => r.id);
  
    if (roomIds.length === 0) {
      return [];
    }
  
    // Get unread messages from these rooms
    const unreadMessages = await this.chatMessageRepository.find({
      where: {
        chatRoomId: In(roomIds),
        isRead: false,
        deleted: false,
        senderId: Not(userId), // Don't include own messages
      },
      relations: ['chatRoom'],
      order: { createdAt: 'DESC' },
    });
  
    return unreadMessages;
  }
  
  /**
   * Get all read messages for a user
   */
  async getReadMessages(userId: string, limit: number = 50): Promise<ChatMessage[]> {
    const rooms = await this.chatRoomRepository
      .createQueryBuilder('room')
      .where('room.participantIds LIKE :userIdPattern', {
        userIdPattern: `%${userId}%`,
      })
      .getMany();
  
    const roomIds = rooms.map(r => r.id);
  
    if (roomIds.length === 0) {
      return [];
    }
  
    const readMessages = await this.chatMessageRepository.find({
      where: {
        chatRoomId: In(roomIds),
        isRead: true,
        deleted: false,
        senderId: Not(userId),
      },
      relations: ['chatRoom'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  
    return readMessages;
  }
  
  /**
   * Mark a single message as read
   */
  async markMessageAsRead(userId: string, messageId: string): Promise<boolean> {
    const message = await this.chatMessageRepository.findOne({
      where: { id: messageId },
      relations: ['chatRoom'],
    });
  
    if (!message) {
      throw new NotFoundException('Message not found');
    }
  
    // Verify user is a participant in the chat room
    if (!message.chatRoom.participantIds.includes(userId)) {
      throw new ForbiddenException('You do not have access to this message');
    }
  
    // Don't mark own messages as read
    if (message.senderId === userId) {
      return true;
    }
  
    await this.chatMessageRepository.update(
      { id: messageId },
      { isRead: true }
    );
  
    // Decrement unread count in Redis
    await this.redisChatProvider.decrementUnreadCount(userId, message.chatRoomId);
  
    return true;
  }
  
}


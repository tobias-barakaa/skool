import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Student } from 'src/admin/student/entities/student.entity';
import { Teacher } from 'src/admin/teacher/entities/teacher.entity';
import { ChatRoom } from 'src/messaging/entities/chat-room.entity';
import { ChatMessage } from 'src/messaging/entities/chat-message.entity';
import { RedisChatProvider } from 'src/messaging/providers/redis-chat.provider';
import { SendMessageFromStudentToTeacherInput } from './dtos/chat-message.dto.teacher';

@Injectable()
export class StudentChatService {
  private readonly logger = new Logger(StudentChatService.name);

  constructor(
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    private readonly redisChatProvider: RedisChatProvider,
  ) {}

  /**
   * Send message from student to a specific teacher
   */

  async sendMessageToTeacher(
    studentUserId: string,
    tenantId: string,
    input: SendMessageFromStudentToTeacherInput,
  ): Promise<ChatMessage> {
    const student = await this.studentRepository.findOne({
      where: { user: { id: studentUserId }, tenant_id: tenantId },
      relations: ['user'],
    });
  
    if (!student) {
      throw new NotFoundException('Student not found');
    }
  
    const teacher = await this.teacherRepository.findOne({
      where: { id: input.recipientId, tenantId },
      relations: ['user'],
    });
  
    if (!teacher || !teacher.user) {
      throw new NotFoundException('Teacher not found or not linked to user');
    }
  
    const chatRoom = await this.getOrCreateChatRoom(
      `teacher-student-${teacher.id}-${student.id}`,
      'DIRECT',
      [teacher.user.id, student.user.id],
      tenantId,
    );
  
    // 4️⃣ Create message
    const message = this.chatMessageRepository.create({
      senderId: studentUserId,      
      senderType: 'STUDENT',
      subject: input.subject,
      message: input.message,
      imageUrl: input.imageUrl,
      chatRoomId: chatRoom.id,
      isRead: false,
    });
  
    const savedMessage = await this.chatMessageRepository.save(message);
  
    // 5️⃣ Reload with chat room relation
    const found = await this.chatMessageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['chatRoom'],
    });
  
    const messageWithRoom: ChatMessage = found ?? Object.assign(savedMessage, { chatRoom });
  
    // 6️⃣ Cache + unread count
    await this.redisChatProvider.cacheMessage(messageWithRoom);
    await this.redisChatProvider.incrementUnreadCount(teacher.user.id, chatRoom.id);
  
    return messageWithRoom;
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

  // async sendMessageToTeacher(
  //   studentUserId: string,
  //   tenantId: string,
  //   input: SendMessageFromStudentToTeacherInput,
  // ): Promise<ChatMessage> {
  //   // Get student by user_id
  //   const student = await this.studentRepository.findOne({
  //     where: { user: { id: studentUserId }, tenant_id: tenantId },
  //     relations: ['user'],
  //   });

  //   if (!student) {
  //     throw new NotFoundException('Student not found');
  //   }

  //   // Get teacher and their user_id
  //   // const teacher = await this.teacherRepository.findOne({
  //   //   where: { id: input.recipientId, tenantId },
  //   //   relations: ['user'],
  //   // });

  //   const teacher = await this.teacherRepository.findOne({
  //     where: { user: { id: input.recipientId }, tenantId },
  //     relations: ['user'],
  //   });
    
 
    

  //   if (!teacher || !teacher.user) {
  //     throw new NotFoundException('Teacher not found or not linked to user');
  //   }

  //   // Create or get chat room between student and teacher
  //   // Use same naming convention as teacher side for consistency
  //   const chatRoom = await this.getOrCreateChatRoom(
  //     `teacher-student-${teacher.id}-${student.id}`,
  //     'DIRECT',
  //     [teacher.user.id, studentUserId],
  //     tenantId,
  //   );

  //   // Create message
  //   const message = this.chatMessageRepository.create({
  //     senderId: studentUserId,
  //     senderType: 'STUDENT',
  //     subject: input.subject,
  //     message: input.message,
  //     imageUrl: input.imageUrl,
  //     chatRoomId: chatRoom.id,
  //     isRead: false,
  //   });

  //   const savedMessage = await this.chatMessageRepository.save(message);

  //   // Reload with relations
  //   const found = await this.chatMessageRepository.findOne({
  //     where: { id: savedMessage.id },
  //     relations: ['chatRoom'],
  //   });

  //   const messageWithRoom: ChatMessage = found ?? Object.assign(savedMessage, { chatRoom });

  //   // Cache in Redis
  //   await this.redisChatProvider.cacheMessage(messageWithRoom);

  //   // Track unread count for teacher
  //   await this.redisChatProvider.incrementUnreadCount(teacher.user.id, chatRoom.id);

  //   return messageWithRoom;
  // }

  /**
   * Get chat history for a specific room (student perspective)
   */
  async getChatHistory(
    studentUserId: string,
    chatRoomId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ChatMessage[]> {
    // 1. Verify that the student is a participant
    const room = await this.chatRoomRepository.findOne({
      where: { id: chatRoomId },
    });

    if (!room || !room.participantIds.includes(studentUserId)) {
      throw new NotFoundException('Chat room not found or access denied');
    }

    // 2. Try cache first (only when we want the first page)
    if (offset === 0) {
      const cachedMessages = await this.redisChatProvider.getRecentMessages(chatRoomId);
      if (cachedMessages.length > 0) {
        return cachedMessages.slice(0, limit).map(msg => ({
          ...msg,
          createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
          chatRoom: room,
        }));
      }
    }

    // 3. Fallback to database
    const messages = await this.chatMessageRepository.find({
      where: { chatRoomId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['chatRoom'],
    });

    // 4. Ensure createdAt is a Date instance
    return messages.map(msg => ({
      ...msg,
      createdAt: msg.createdAt instanceof Date ? msg.createdAt : new Date(msg.createdAt),
    }));
  }

  /**
   * Mark messages as read (student marking teacher's messages)
   */
  async markMessagesAsRead(
    studentUserId: string,
    chatRoomId: string,
  ): Promise<boolean> {
    const room = await this.chatRoomRepository.findOne({
      where: { id: chatRoomId },
    });

    if (!room || !room.participantIds.includes(studentUserId)) {
      throw new NotFoundException('Chat room not found or access denied');
    }

    // Mark all unread messages from other participants (teacher) as read
    await this.chatMessageRepository.update(
      { 
        chatRoomId, 
        isRead: false, 
        senderId: In([...room.participantIds.filter(id => id !== studentUserId)]) 
      },
      { isRead: true },
    );

    // Clear unread count in Redis
    await this.redisChatProvider.clearUnreadCount(studentUserId, chatRoomId);

    return true;
  }

  /**
   * Get unread message count for student
   */
  async getUnreadCount(studentUserId: string): Promise<number> {
    return await this.redisChatProvider.getTotalUnreadCount(studentUserId);
  }

  /**
   * Get all chat rooms for a student
   */
  // async getStudentChatRooms(studentUserId: string): Promise<ChatRoom[]> {
  //   const rooms = await this.chatRoomRepository
  //     .createQueryBuilder('room')
  //     .where("room.participantIds LIKE :userIdPattern", { 
  //       userIdPattern: `%${studentUserId}%` 
  //     })
  //     .orderBy('room.updatedAt', 'DESC')
  //     .getMany();

  //   return rooms;
  // }

  // async getStudentChatRooms(studentUserId: string): Promise<ChatRoom[]> {
  //   const rooms = await this.chatRoomRepository
  //     .createQueryBuilder('room')
  //     .leftJoinAndSelect('room.messages', 'message') // Eager load messages
  //     .where("room.participantIds LIKE :userIdPattern", { userIdPattern: `%${studentUserId}%` })
  //     .orderBy('room.updatedAt', 'DESC')
  //     .addOrderBy('message.createdAt', 'ASC') // Order messages within each room
  //     .getMany();

  //   // The messages relationship will now be populated for each room.
  //   // However, if you want only the *last* message for a preview,
  //   // or a limited number of messages, the logic needs to be more complex.
  //   // For now, this will load ALL messages for ALL rooms.

  //   // A more efficient approach for a "last message preview" or initial load might involve:
  //   // 1. Fetching rooms as above (without messages relation).
  //   // 2. For each room, separately fetch the *last* message or a few recent messages.
  //   //    This can be done with a subquery or by calling getChatHistory for each room.
  //   // For simplicity, let's proceed with loading all for demonstration.

  //   return rooms;
  // }



  async getStudentChatRooms(studentUserId: string): Promise<ChatRoom[]> {
    const rooms = await this.chatRoomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.messages', 'message', 'message.deleted = false')
      .where('room.participantIds LIKE :userIdPattern', {
        userIdPattern: `%${studentUserId}%`,
      })
      .orderBy('room.updatedAt', 'DESC')
      .addOrderBy('message.createdAt', 'ASC') 
      .getMany();
  
    return rooms.filter(room => room.messages.length > 0);
  }


  async getMessageById(
    messageId: string,
    currentUserId?: string,
  ): Promise<ChatMessage> {
    const message = await this.chatMessageRepository.findOne({
      where: { id: messageId },
      relations: ['chatRoom'], // load chatRoom so we can check participants
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // If caller provided a user id, ensure they are a participant of the room
    if (currentUserId) {
      const participantIds = message.chatRoom?.participantIds ?? [];
      // participantIds may be stored as string[] or JSONB - adapt if yours differs
      if (!participantIds.includes(currentUserId)) {
        throw new ForbiddenException('You are not a participant of this chat room');
      }
    }

    return message;
  }

  /**
   * Get chat room with a specific teacher
   */
  async getChatRoomWithTeacher(
    studentUserId: string,
    teacherId: string,
    tenantId: string,
  ): Promise<ChatRoom | null> {
    const student = await this.studentRepository.findOne({
      where: { user: { id: studentUserId }, tenant_id: tenantId },
    });
    console.log(student, 'this is the stende yohh')

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId, tenantId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const roomName = `teacher-student-${teacher.id}-${student.id}`;
    
    const room = await this.chatRoomRepository.findOne({
      where: { name: roomName },
    });

    return room;
  }

  /**
   * Get all teachers that the student has chat rooms with
   */
  async getStudentTeachers(studentUserId: string, tenantId: string): Promise<Teacher[]> {
    const student = await this.studentRepository.findOne({
      where: { user: { id: studentUserId }, tenant_id: tenantId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Get all chat rooms for this student
    const rooms = await this.getStudentChatRooms(studentUserId);

    // Extract teacher user IDs from room names and participant IDs
    const teacherUserIds = rooms
      .flatMap(room => room.participantIds)
      .filter(id => id !== studentUserId);

    if (teacherUserIds.length === 0) {
      return [];
    }

    // Get teachers by user IDs
    const teachers = await this.teacherRepository.find({
      where: { 
        user: { id: In(teacherUserIds) },
        tenantId 
      },
      relations: ['user'],
    });

    return teachers;
  }

  /**
   * Get or create chat room (private helper)
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
}
import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { Student } from 'src/admin/student/entities/student.entity';
import { Teacher } from 'src/admin/teacher/entities/teacher.entity';
import { ParentStudent } from 'src/admin/parent/entities/parent-student.entity';
import { Parent } from 'src/admin/parent/entities/parent.entity';
import { SendMessageFromParentToTeacherInput } from 'src/messaging/dtos/send-message-from-parent-to-teacher.input';
import { ChatMessage } from 'src/messaging/entities/chat-message.entity';
import { RedisChatProvider } from 'src/messaging/providers/redis-chat.provider';
import { ChatRoom } from 'src/messaging/entities/chat-room.entity';

@Injectable()
export class ParentChatService {
  private readonly logger = new Logger(ParentChatService.name);

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
  ) {}

  /**
   * Send message from parent to a specific teacher about their child
   */
  async sendMessageToTeacher(
    parentUserId: string,
    tenantId: string,
    input: SendMessageFromParentToTeacherInput,
  ): Promise<ChatMessage> {
    // Get parent by user_id
    const parent = await this.parentRepository.findOne({
      where: { user: { id: parentUserId }, tenantId },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    // Verify parent-student relationship
    const relationship = await this.parentStudentRepository.findOne({
      where: { 
        parentId: parent.id, 
        studentId: input.studentId, 
        tenantId 
      },
    });

    if (!relationship) {
      throw new BadRequestException('You are not linked to this student');
    }

    // Get teacher and their user_id
    const teacher = await this.teacherRepository.findOne({
      where: { id: input.recipientId, tenantId },
      relations: ['user'],
    });

    if (!teacher || !teacher.user) {
      throw new NotFoundException('Teacher not found or not linked to user');
    }

    const participants = [parent.id, teacher.id].sort((a, b) => a.localeCompare(b));
const roomName = `teacher-parent-${participants[0]}-${participants[1]}`;

const chatRoom = await this.getOrCreateChatRoom(
  roomName,
  'DIRECT',
  [parentUserId, teacher.user.id],
  tenantId,
);

    // // Create or get chat room between parent and teacher
    // const chatRoom = await this.getOrCreateChatRoom(
    //   `parent-teacher-${parent.id}-${teacher.id}`,
    //   'DIRECT',
    //   [parentUserId, teacher.user.id],
    //   tenantId,
    // );

    

    // Create message
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

    // Reload with relations
    const found = await this.chatMessageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['chatRoom'],
    });

    const messageWithRoom: ChatMessage = found ?? Object.assign(savedMessage, { chatRoom });

    // Cache in Redis
    await this.redisChatProvider.cacheMessage(messageWithRoom);

    // Track unread count for teacher
    await this.redisChatProvider.incrementUnreadCount(teacher.user.id, chatRoom.id);

    return messageWithRoom;
  }

  /**
   * Get chat history for a specific room (parent view)
   */
  async getChatHistory(
    parentUserId: string,
    chatRoomId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ChatMessage[]> {
    // Verify that the parent is a participant
    const room = await this.chatRoomRepository.findOne({
      where: { id: chatRoomId },
    });

    if (!room || !room.participantIds.includes(parentUserId)) {
      throw new NotFoundException('Chat room not found or access denied');
    }

    // Try cache first (only when we want the first page)
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

    // Fallback to database
    const messages = await this.chatMessageRepository.find({
      where: { 
        chatRoomId,
        deleted: false 
      },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['chatRoom'],
    });

    return messages.map(msg => ({
      ...msg,
      createdAt: msg.createdAt instanceof Date ? msg.createdAt : new Date(msg.createdAt),
    }));
  }

  /**
   * Get all chat rooms for a parent
   */
  async getUserChatRooms(parentUserId: string): Promise<ChatRoom[]> {
    const rooms = await this.chatRoomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.messages', 'message', 'message.deleted = false')
      .where('room.participantIds LIKE :userIdPattern', {
        userIdPattern: `%${parentUserId}%`,
      })
      .orderBy('room.updatedAt', 'DESC')
      .addOrderBy('message.createdAt', 'ASC')
      .getMany();

    return rooms.filter(room => room.messages.length > 0);
  }

  /**
   * Mark messages as read in a room
   */
  async markMessagesAsRead(
    parentUserId: string,
    chatRoomId: string,
  ): Promise<boolean> {
    const room = await this.chatRoomRepository.findOne({
      where: { id: chatRoomId },
    });

    if (!room || !room.participantIds.includes(parentUserId)) {
      throw new NotFoundException('Chat room not found or access denied');
    }

    await this.chatMessageRepository.update(
      { 
        chatRoomId, 
        isRead: false, 
        senderId: Not(parentUserId),
        deleted: false
      },
      { isRead: true },
    );

    // Clear unread count in Redis
    await this.redisChatProvider.clearUnreadCount(parentUserId, chatRoomId);

    return true;
  }

  /**
   * Mark a single message as read
   */
  async markMessageAsRead(parentUserId: string, messageId: string): Promise<boolean> {
    const message = await this.chatMessageRepository.findOne({
      where: { id: messageId },
      relations: ['chatRoom'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Verify parent is a participant in the chat room
    if (!message.chatRoom.participantIds.includes(parentUserId)) {
      throw new ForbiddenException('You do not have access to this message');
    }

    // Don't mark own messages as read
    if (message.senderId === parentUserId) {
      return true;
    }

    await this.chatMessageRepository.update(
      { id: messageId },
      { isRead: true }
    );

    // Decrement unread count in Redis
    await this.redisChatProvider.decrementUnreadCount(parentUserId, message.chatRoomId);

    return true;
  }

  /**
   * Get unread message count for parent
   */
  async getUnreadCount(parentUserId: string): Promise<number> {
    return await this.redisChatProvider.getTotalUnreadCount(parentUserId);
  }

  /**
   * Get all unread messages for a parent
   */
  async getUnreadMessages(parentUserId: string): Promise<ChatMessage[]> {
    const rooms = await this.chatRoomRepository
      .createQueryBuilder('room')
      .where('room.participantIds LIKE :userIdPattern', {
        userIdPattern: `%${parentUserId}%`,
      })
      .getMany();

    const roomIds = rooms.map(r => r.id);

    if (roomIds.length === 0) {
      return [];
    }

    const unreadMessages = await this.chatMessageRepository.find({
      where: {
        chatRoomId: In(roomIds),
        isRead: false,
        deleted: false,
        senderId: Not(parentUserId),
      },
      relations: ['chatRoom'],
      order: { createdAt: 'DESC' },
    });

    return unreadMessages;
  }

  async getReadMessages(parentUserId: string, limit: number = 50): Promise<ChatMessage[]> {
    const rooms = await this.chatRoomRepository
      .createQueryBuilder('room')
      .where('room.participantIds LIKE :userIdPattern', {
        userIdPattern: `%${parentUserId}%`,
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
        senderId: Not(parentUserId),
      },
      relations: ['chatRoom'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return readMessages;
  }

  
  async deleteMessage(
    parentUserId: string,
    tenantId: string,
    messageId: string,
    options?: { hard?: boolean },
  ): Promise<boolean> {
    // Find message with room
    const message = await this.chatMessageRepository.findOne({
      where: { id: messageId },
      relations: ['chatRoom'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== parentUserId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    if (options?.hard) {
      await this.chatMessageRepository.delete({ id: messageId });

      // Clean Redis cache
      await this.redisChatProvider.removeCachedMessage(messageId);
      return true;
    }

    // Otherwise mark as deleted (soft delete)
    await this.chatMessageRepository.update(
      { id: messageId },
      { deleted: true },
    );

    // Optionally remove from Redis visible list
    await this.redisChatProvider.markMessageDeleted(messageId, message.chatRoomId);

    return true;
  }

  /**
   * Get list of teachers for a specific student (so parent knows who to message)
   */
  async getTeachersForStudent(
    parentUserId: string,
    studentId: string,
    tenantId: string,
  ): Promise<Teacher[]> {
    // Verify parent-student relationship
    const parent = await this.parentRepository.findOne({
      where: { user: { id: parentUserId }, tenantId },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    const relationship = await this.parentStudentRepository.findOne({
      where: { 
        parentId: parent.id, 
        studentId, 
        tenantId 
      },
    });

    if (!relationship) {
      throw new BadRequestException('You are not linked to this student');
    }

    // Get student with their grade/class info
    const student = await this.studentRepository.findOne({
      where: { id: studentId, tenant_id: tenantId },
      relations: ['grade'],
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Get teachers associated with this student's grade/class
    // This assumes teachers are linked to grades - adjust based on your schema
    const teachers = await this.teacherRepository.find({
      where: { 
        tenantId, 
        isActive: true 
      },
      relations: ['user'],
    });

    return teachers;
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



  async getChatRoomWithTeacher(
    parentUserId: string,
    teacherId: string,
    tenantId: string,
  ): Promise<ChatRoom | null> {
    const parent = await this.parentRepository.findOne({
      where: { user: { id: parentUserId }, tenantId },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    const teacher = await this.teacherRepository.findOne({
      where: { id: teacherId, tenantId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // const roomName = `teacher-parent-${teacher.id}-${parent.id}`;

    const participants = [teacher.id, parent.id].sort((a, b) => a.localeCompare(b));
const roomName = `teacher-parent-${participants[0]}-${participants[1]}`;

    
    const room = await this.chatRoomRepository.findOne({
      where: { name: roomName },
      relations: ['messages'],
    });

    return room;
  }
}
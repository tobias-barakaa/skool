import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ChatRoom } from '../entities/chat-room.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { SendMessageInput } from '../dtos/send-message.input';
import { Student } from 'src/admin/student/entities/student.entity';
import { Parent } from 'src/admin/parent/entities/parent.entity';

@Injectable()
export class ChatProvider {
  private readonly logger = new Logger(ChatProvider.name);

  constructor(
    @InjectRepository(ChatRoom)
    private chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,

    @InjectRepository(Student)
    private studentRepository: Repository<Student>,

    @InjectRepository(Parent)
    private parentRepository: Repository<Parent>,

    private readonly dataSource: DataSource,
  ) {}

  async findOrCreateChatRoom(
    participantIds: string[],
    type: string,
    name?: string,
  ): Promise<ChatRoom> {
    const sortedIds = participantIds.sort();

    const existingRoom = await this.chatRoomRepository
      .createQueryBuilder('room')
      .where('room.type = :type', { type })
      .andWhere('room.participantIds = :participantIds', {
        participantIds: sortedIds.join(','),
      })
      .getOne();

    if (existingRoom) {
      return existingRoom;
    }

    // Create new room
    const chatRoom = this.chatRoomRepository.create({
      name: name || `Chat ${Date.now()}`,
      type,
      participantIds: sortedIds,
    });

    return await this.chatRoomRepository.save(chatRoom);
  }

  async getAllStudentsByTenant(tenantId: string): Promise<Student[]> {
    return await this.studentRepository.find({
      where: { tenant: { id: tenantId }, isActive: true },
      relations: ['user'], // to get `userId`
    });
  }

  async createMessage(
    senderId: string,
    senderType: string,
    chatRoomId: string,
    messageData: Partial<SendMessageInput>,
  ): Promise<ChatMessage> {
    const message = this.chatMessageRepository.create({
      senderId,
      senderType,
      chatRoomId,
      subject: messageData.subject,
      message: messageData.message,
      imageUrl: messageData.imageUrl,
    });

    const savedMessage = await this.chatMessageRepository.save(message);

    const foundMessage = await this.chatMessageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['chatRoom'],
    });

    if (!foundMessage) {
      throw new Error(`Message with ID ${savedMessage.id} not found`);
    }

    return foundMessage;
  }

  async getChatRoomMessages(
    chatRoomId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ChatMessage[]> {
    return await this.chatMessageRepository.find({
      where: { chatRoomId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['chatRoom'],
    });
  }

  async getUserChatRooms(userId: string): Promise<ChatRoom[]> {
    return await this.chatRoomRepository
      .createQueryBuilder('room')
      .where(":userId = ANY(string_to_array(room.participantIds, ','))", {
        userId,
      })
      .leftJoinAndSelect('room.messages', 'message')
      .orderBy('room.updatedAt', 'DESC')
      .getMany();
  }

  async markMessagesAsRead(chatRoomId: string, userId: string): Promise<void> {
    await this.chatMessageRepository
      .createQueryBuilder()
      .update(ChatMessage)
      .set({ isRead: true })
      .where('chatRoomId = :chatRoomId', { chatRoomId })
      .andWhere('senderId != :userId', { userId })
      .andWhere('isRead = false')
      .execute();
  }

  async getParentById(parentId: string): Promise<Parent | null> {
    return this.parentRepository.findOne({
      where: { id: parentId },
      relations: ['user'],
    });
  }

  async getAllParentsByTenant(tenantId: string): Promise<Parent[]> {
    return this.parentRepository.find({
      where: { tenantId },
      relations: ['user'],
    });
  }

  async getAllStudentsByGrade(gradeId: string): Promise<Student[]> {
    return this.studentRepository.find({
      where: { grade: { id: gradeId }, isActive: true },
      relations: ['user'],
    });
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    const rooms = await this.getUserChatRooms(userId);
    const roomIds = rooms.map((room) => room.id);

    if (roomIds.length === 0) return 0;

    const { count } = await this.chatMessageRepository
      .createQueryBuilder('message')
      .select('COUNT(*)', 'count')
      .where('message.chatRoomId IN (:...roomIds)', { roomIds })
      .andWhere('message.senderId != :userId', { userId })
      .andWhere('message.isRead = false')
      .getRawOne();

    return parseInt(count) || 0;
  }

  async getStudentByUserId(
    userId: string,
    tenantId: string,
  ): Promise<Student | null> {
    const studentRepository = this.dataSource.getRepository(Student);
    return studentRepository.findOne({
      where: {
        user: { id: userId },
        tenant: { id: tenantId },
      },
      relations: ['user'],
    });
  }

  async getStudentById(studentId: string, tenantId: string): Promise<any> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();

    try {
      const query = `
        SELECT s.*, s.user_id, u.name AS user_name, u.email
        FROM students s
        JOIN users u ON s.user_id = u.id
        WHERE s.id = $1 AND s.tenant_id = $2
      `;
      const result = await qr.query(query, [studentId, tenantId]);
      return result[0] || null;
    } finally {
      await qr.release();
    }
  }

  async getTeacherByUserId(userId: string, tenantId: string): Promise<any> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    try {
      const query = `
      SELECT t.*, u.name AS user_name, u.email
      FROM   teacher t
      JOIN   users u ON u.id = t.user_id
      JOIN   user_tenant_memberships utm
             ON utm."userId" = u.id
      WHERE  t.user_id = $1
        AND  utm."tenantId" = $2;
    `;
      const result = await qr.query(query, [userId, tenantId]);
      console.log('result', result);
      return result[0] ?? null;
    } finally {
      await qr.release();
    }
  }


  async getTeacherById(teacherId: string, tenantId: string): Promise<any> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();

    try {
      const query = `
        SELECT t.*, t.user_id, u.name AS user_name, u.email
        FROM teachers t
        JOIN users u ON t.user_id = u.id
        WHERE t.id = $1 AND t.tenant_id = $2
      `;
      const result = await qr.query(query, [teacherId, tenantId]);
      return result[0] || null;
    } finally {
      await qr.release();
    }
  }
  /////////////////////
  // async getTeacherByUserId(userId: string, tenantId: string): Promise<any> {
  //   const qr = this.dataSource.createQueryRunner();
  //   await qr.connect();

  //   try {
  //     const query = `
  //       SELECT t.*, u.first_name, u.last_name, u.email
  //       FROM teachers t
  //       JOIN users u ON t.user_id = u.id
  //       WHERE t.user_id = $1 AND u.tenant_id = $2
  //     `;
  //     const result = await qr.query(query, [userId, tenantId]);
  //     return result[0] || null;
  //   } finally {
  //     await qr.release();
  //   }
  // }

  // async getStudentById(studentId: string, tenantId: string): Promise<any> {
  //   const qr = this.dataSource.createQueryRunner();
  //   await qr.connect();

  //   try {
  //     const query = `
  //     SELECT
  //       s.*,
  //       u.name AS user_name,
  //       u.email
  //     FROM students s
  //     JOIN users u ON s.user_id = u.id
  //     WHERE s.id = $1 AND s.tenant_id = $2
  //   `;

  //     const result = await qr.query(query, [studentId, tenantId]);
  //     return result[0] || null;
  //   } finally {
  //     await qr.release();
  //   }
  // }

  ///

  // async getStudentByUserId(
  //     userId: string,
  //     tenantId: string,
  //   ): Promise<Student | null> {
  //     const studentRepository = this.dataSource.getRepository(Student);
  //     return studentRepository.findOne({
  //       where: {
  //         user: { id: userId },
  //         tenant: { id: tenantId },
  //       },
  //       relations: ['user'],
  //     });
  //   }

  // async getStudentById(studentId: string): Promise<Student | null> {
  //   return this.studentRepository.findOne({
  //     where: { id: studentId },
  //     relations: ['user'],
  //   });
  // }
}

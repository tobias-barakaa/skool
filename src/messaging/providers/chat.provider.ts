import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoom } from '../entities/chat-room.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { SendMessageInput } from '../dtos/send-message.input';

@Injectable()
export class ChatProvider {
  private readonly logger = new Logger(ChatProvider.name);

  constructor(
    @InjectRepository(ChatRoom)
    private chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
  ) {}

  async findOrCreateChatRoom(participantIds: string[], type: string, name?: string): Promise<ChatRoom> {
    // Sort participant IDs to ensure consistent room finding
    const sortedIds = participantIds.sort();

    // Try to find existing room with same participants
    const existingRoom = await this.chatRoomRepository
      .createQueryBuilder('room')
      .where('room.type = :type', { type })
      .andWhere('room.participantIds = :participantIds', {
        participantIds: sortedIds.join(',')
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

  async createMessage(
    senderId: string,
    senderType: string,
    chatRoomId: string,
    messageData: Partial<SendMessageInput>
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

    // Load the message with relations for return
    const foundMessage = await this.chatMessageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['chatRoom'],
    });

    if (!foundMessage) {
      throw new Error(`Message with ID ${savedMessage.id} not found`);
    }

    return foundMessage;
  }

  async getChatRoomMessages(chatRoomId: string, limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
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
      .where(':userId = ANY(string_to_array(room.participantIds, \',\'))', { userId })
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

  async getUnreadMessageCount(userId: string): Promise<number> {
    const rooms = await this.getUserChatRooms(userId);
    const roomIds = rooms.map(room => room.id);

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
}

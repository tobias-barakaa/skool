import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChatRoomDto } from '../dtos/chat-room.dto';
import { ChatMessageDto } from '../dtos/chat-message.dto';
import { ChatUser } from '../dtos/chat-user.dto';
import { GetChatRoomsArgs } from '../dtos/get-chat-rooms.args';
import { GetMessagesArgs } from '../dtos/get-messages.args';
import { SendMessageToTeacherInput } from '../dtos/send-message.input';
import { MessagesResponse } from '../dtos/messages-response.dto';

@Injectable()
export class StudentChatProvider {
  private readonly logger = new Logger(StudentChatProvider.name);

  constructor(private readonly dataSource: DataSource) {}

  async getStudentByUserId(userId: string, tenantId: string): Promise<any> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    try {
      const query = `
        SELECT s.*, s.user_id, u.name AS user_name, u.email
        FROM students s
        JOIN users u ON s.user_id = u.id
        WHERE s.user_id = $1 AND s.tenant_id = $2
      `;
      const result = await qr.query(query, [userId, tenantId]);
      return result[0] || null;
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
        FROM teacher t
        JOIN users u ON t.user_id = u.id
        JOIN user_tenant_memberships utm ON utm."userId" = u.id
        WHERE t.id = $1 AND utm."tenantId" = $2
      `;
      const result = await qr.query(query, [teacherId, tenantId]);
      return result[0] || null;
    } finally {
      await qr.release();
    }
  }

  async getChatRoomsByUserId(
    userId: string,
    tenantId: string,
    roomType: string,
    args: GetChatRoomsArgs,
  ): Promise<{ chatRooms: ChatRoomDto[]; total: number }> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();

    try {
      // Count total rooms
      const countQuery = `
        SELECT COUNT(*) as total
FROM chat_rooms cr
WHERE $1::text = ANY(string_to_array(cr."participantIds", ','))
  AND cr.type = $2

      `;
      const countResult = await qr.query(countQuery, [userId, roomType]);
      const total = parseInt(countResult[0].total, 10);

      // Fetch chat rooms with details
      const chatRoomsQuery = `
 SELECT DISTINCT
  cr.id,
  cr.name,
  cr.type,
  cr."createdAt" as created_at,
  cr."updatedAt" as updated_at,
  cr."participantIds" as participant_ids,
  lm.id as last_message_id,
  lm.message as last_message_text,
  lm.subject as last_message_subject,
  lm."imageUrl" as last_message_image_url,
  lm."createdAt" as last_message_created_at,
  lm."senderId" as last_message_sender_id,
  lm."senderType" as last_message_sender_type,
  lm."isRead" as last_message_is_read,
  COALESCE(unread.unread_count, 0) as unread_count,
  COALESCE(lm."createdAt", cr."createdAt") as sort_date
FROM chat_rooms cr
  LEFT JOIN LATERAL (
    SELECT cm.*
    FROM chat_messages cm
    WHERE cm."chatRoomId" = cr.id
    ORDER BY cm."createdAt" DESC
    LIMIT 1
  ) lm ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*) as unread_count
    FROM chat_messages cm2
    WHERE cm2."chatRoomId" = cr.id
      AND cm2."senderId" != $1
      AND cm2."isRead" = false
  ) unread ON true
  WHERE $1::text = ANY(string_to_array(cr."participantIds", ','))
    AND cr.type = $2
  ORDER BY COALESCE(lm."createdAt", cr."createdAt") DESC
  LIMIT $3 OFFSET $4
`;

      const chatRoomsResult = await qr.query(chatRoomsQuery, [
        userId,
        roomType,
        args.limit,
        args.offset,
      ]);

      const chatRooms: ChatRoomDto[] = [];

      for (const row of chatRoomsResult) {
        const participantUserIds = row.participant_ids
          ? row.participant_ids.split(',')
          : [];

        // Get participant details
        const participantsQuery = `
  SELECT
    u.id,
    u.name,
    u.email,
   CASE
  WHEN EXISTS(SELECT 1 FROM students WHERE user_id = u.id AND tenant_id = $1) THEN 'STUDENT'
  WHEN EXISTS(SELECT 1 FROM teacher WHERE user_id = u.id) THEN 'TEACHER'
  WHEN EXISTS(SELECT 1 FROM parents WHERE user_id = u.id AND tenant_id = $1) THEN 'PARENT'
  ELSE 'UNKNOWN'
END as user_type

  FROM users u
  WHERE u.id = ANY($2::uuid[])
`;
        const participantsResult = await qr.query(participantsQuery, [
          tenantId,
          participantUserIds,
        ]);

        const participants: ChatUser[] = participantsResult.map((p) => ({
          id: p.id,
          name: p.name,
          email: p.email,
          userType: p.user_type,
        }));

        const chatRoom: ChatRoomDto = {
          id: row.id,
          name: row.name,
          type: row.type,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
          participants,
          unreadCount: parseInt(row.unread_count, 10),
          lastMessage: undefined,
        };

        if (row.last_message_id) {
          // Get sender details
          const senderQuery = `
            SELECT u.id, u.name, u.email,
  CASE
    WHEN EXISTS(SELECT 1 FROM students WHERE user_id = u.id) THEN 'STUDENT'
    WHEN EXISTS(SELECT 1 FROM teacher WHERE user_id = u.id) THEN 'TEACHER'
    WHEN EXISTS(SELECT 1 FROM parents WHERE user_id = u.id) THEN 'PARENT'
    ELSE 'UNKNOWN'
  END as user_type
            FROM users u
            WHERE u.id = $1
          `;
          const senderResult = await qr.query(senderQuery, [
            row.last_message_sender_id,
          ]);
          const sender = senderResult[0];

          chatRoom.lastMessage = {
            id: row.last_message_id,
            message: row.last_message_text,
            subject: row.last_message_subject,
            imageUrl: row.last_message_image_url,
            createdAt: new Date(row.last_message_created_at),
            sender: {
              id: sender.id,
              name: sender.name,
              email: sender.email,
              userType: sender.user_type,
            },
            chatRoom: chatRoom,
            isRead: row.last_message_is_read,
          };
        }

        chatRooms.push(chatRoom);
      }

      return { chatRooms, total };
    } finally {
      await qr.release();
    }
  }

  async getMessages(
    userId: string,
    tenantId: string,
    args: GetMessagesArgs,
  ): Promise<MessagesResponse> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();

    try {
      let chatRoomId = args.chatRoomId;

      // If teacherId provided, find the chat room
      if (args.teacherId && !chatRoomId) {
        const teacher = await this.getTeacherById(args.teacherId, tenantId);
        if (!teacher) {
          throw new Error('Teacher not found');
        }

        const teacherUserId = teacher.user_id;
        const sortedIds = [userId, teacherUserId].sort();

        const findRoomQuery = `
          SELECT id
          FROM chat_rooms
          WHERE type = 'TEACHER_STUDENT'
            AND "participantIds" = $1
          LIMIT 1
        `;
        const roomResult = await qr.query(findRoomQuery, [sortedIds.join(',')]);

        if (roomResult.length > 0) {
          chatRoomId = roomResult[0].id;
        } else {
          // No messages yet, return empty
          const emptyChatRoom: ChatRoomDto = {
            id: '',
            name: 'Teacher-Student Chat',
            type: 'TEACHER_STUDENT',
            createdAt: new Date(),
            updatedAt: new Date(),
            participants: [],
            unreadCount: 0,
          };

          return {
            messages: [],
            total: 0,
            totalPages: 0,
            currentPage: 1,
            chatRoom: emptyChatRoom,
          };
        }
      }

      if (!chatRoomId) {
        throw new Error('Chat room ID or teacher ID is required');
      }

      // Verify user is participant
      const verifyQuery = `
        SELECT cr.*
        FROM chat_rooms cr
        WHERE cr.id = $1
          AND $2 = ANY(string_to_array(cr."participantIds", ','))
      `;
      const verifyResult = await qr.query(verifyQuery, [chatRoomId, userId]);

      if (!verifyResult.length) {
        throw new Error('Unauthorized: Not a participant in this chat room');
      }

      const chatRoomRow = verifyResult[0];

      // Count total messages
      const countQuery = `
        SELECT COUNT(*) as total
        FROM chat_messages
        WHERE "chatRoomId" = $1
      `;
      const countResult = await qr.query(countQuery, [chatRoomId]);
      const total = parseInt(countResult[0].total, 10);

      // Fetch messages
      const messagesQuery = `
        SELECT
          cm.id,
          cm.message,
          cm.subject,
          cm."imageUrl" as image_url,
          cm."createdAt" as created_at,
          cm."senderId" as sender_id,
          cm."senderType" as sender_type,
          cm."isRead" as is_read,
          u.id as user_id,
          u.name as user_name,
          u.email as user_email
        FROM chat_messages cm
        JOIN users u ON cm."senderId" = u.id
        WHERE cm."chatRoomId" = $1
        ORDER BY cm."createdAt" DESC
        LIMIT $2 OFFSET $3
      `;

      const messagesResult = await qr.query(messagesQuery, [
        chatRoomId,
        args.limit,
        args.offset,
      ]);

      // Get chat room participants
      const participantUserIds = chatRoomRow.participantIds
        ? chatRoomRow.participantIds.split(',')
        : [];

      const participantsQuery = `
        SELECT
          u.id,
          u.name,
          u.email,
          CASE
            WHEN EXISTS(SELECT 1 FROM students WHERE user_id = u.id AND tenant_id = $1) THEN 'STUDENT'
            WHEN EXISTS(SELECT 1 FROM teacher WHERE user_id = u.id) THEN 'TEACHER'
            WHEN EXISTS(SELECT 1 FROM parents WHERE user_id = u.id AND "tenantId" = $1) THEN 'PARENT'
            ELSE 'UNKNOWN'
          END as user_type
        FROM users u
        WHERE u.id = ANY($2::uuid[])
      `;
      const participantsResult = await qr.query(participantsQuery, [
        tenantId,
        participantUserIds,
      ]);

      const participants: ChatUser[] = participantsResult.map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        userType: p.user_type,
      }));

      const chatRoom: ChatRoomDto = {
        id: chatRoomRow.id,
        name: chatRoomRow.name,
        type: chatRoomRow.type,
        createdAt: new Date(chatRoomRow.createdAt),
        updatedAt: new Date(chatRoomRow.updatedAt),
        participants,
      };

      const messages: ChatMessageDto[] = messagesResult.map((m) => {
        const sender: ChatUser = {
          id: m.user_id,
          name: m.user_name,
          email: m.user_email,
          userType: m.sender_type,
        };

        return {
          id: m.id,
          message: m.message,
          subject: m.subject,
          imageUrl: m.image_url,
          createdAt: new Date(m.created_at),
          sender,
          chatRoom,
          isRead: m.is_read,
        };
      });

      const limit = args.limit || 20;
      const currentPage = Math.floor((args.offset || 0) / limit) + 1;
      const totalPages = Math.ceil(total / limit);

      return {
        messages,
        total,
        totalPages,
        currentPage,
        chatRoom,
      };
    } finally {
      await qr.release();
    }
  }

  async findOrCreateChatRoom(
    participantIds: string[],
    type: string,
    name?: string,
  ): Promise<ChatRoomDto> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();

    try {
      const sortedIds = participantIds.sort();
      const participantIdsStr = sortedIds.join(',');

      // Try to find existing room
      const findQuery = `
        SELECT * FROM chat_rooms
        WHERE type = $1 AND "participantIds" = $2
        LIMIT 1
      `;
      const existingRooms = await qr.query(findQuery, [type, participantIdsStr]);

      if (existingRooms.length > 0) {
        const room = existingRooms[0];

        // Get participants
        const participantsQuery = `
          SELECT
            u.id,
            u.name,
            u.email,
            CASE
              WHEN EXISTS(SELECT 1 FROM students WHERE user_id = u.id) THEN 'STUDENT'
              WHEN EXISTS(SELECT 1 FROM teacher WHERE user_id = u.id) THEN 'TEACHER'
              WHEN EXISTS(SELECT 1 FROM parents WHERE user_id = u.id) THEN 'PARENT'
              ELSE 'UNKNOWN'
            END as user_type
          FROM users u
          WHERE u.id = ANY($1::uuid[])
        `;
        const participantsResult = await qr.query(participantsQuery, [sortedIds]);

        return {
          id: room.id,
          name: room.name,
          type: room.type,
          createdAt: new Date(room.createdAt),
          updatedAt: new Date(room.updatedAt),
          participants: participantsResult.map((p: any) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            userType: p.user_type,
          })),
        };
      }

      // Create new room
      const createQuery = `
        INSERT INTO chat_rooms (name, type, "participantIds", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING *
      `;
      const createResult = await qr.query(createQuery, [
        name || `Chat ${Date.now()}`,
        type,
        participantIdsStr,
      ]);

      const room = createResult[0];

      // Get participants
      const participantsQuery = `
        SELECT
          u.id,
          u.name,
          u.email,
          CASE
            WHEN EXISTS(SELECT 1 FROM students WHERE user_id = u.id) THEN 'STUDENT'
            WHEN EXISTS(SELECT 1 FROM teacher WHERE user_id = u.id) THEN 'TEACHER'
            WHEN EXISTS(SELECT 1 FROM parents WHERE user_id = u.id) THEN 'PARENT'
            ELSE 'UNKNOWN'
          END as user_type
        FROM users u
        WHERE u.id = ANY($1::uuid[])
      `;
      const participantsResult = await qr.query(participantsQuery, [sortedIds]);

      return {
        id: room.id,
        name: room.name,
        type: room.type,
        createdAt: new Date(room.createdAt),
        updatedAt: new Date(room.updatedAt),
        participants: participantsResult.map((p: any) => ({
          id: p.id,
          name: p.name,
          email: p.email,
          userType: p.user_type,
        })),
      };
    } finally {
      await qr.release();
    }
  }

  async createMessage(
    senderId: string,
    senderType: string,
    chatRoomId: string,
    messageData: Partial<SendMessageToTeacherInput>,
  ): Promise<any> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();

    try {
      const insertQuery = `
        INSERT INTO chat_messages (
          "senderId", "senderType", "chatRoomId", subject, message, "imageUrl", "isRead", "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
        RETURNING *
      `;

      const result = await qr.query(insertQuery, [
        senderId,
        senderType,
        chatRoomId,
        messageData.subject,
        messageData.message,
        messageData.imageUrl,
      ]);

      return result[0];
    } finally {
      await qr.release();
    }
  }

  async markMessagesAsRead(chatRoomId: string, userId: string): Promise<void> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();

    try {
      const updateQuery = `
        UPDATE chat_messages
        SET "isRead" = true
        WHERE "chatRoomId" = $1
          AND "senderId" != $2
          AND "isRead" = false
      `;
      await qr.query(updateQuery, [chatRoomId, userId]);
    } finally {
      await qr.release();
    }
  }
}
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChatRoomInput } from '../dtos/chat-room.dto';
import { ChatMessageInput, ChatUser } from '../dtos/chat-response.dto';
import { GetChatRoomsArgs } from '../dtos/get-chat-rooms.args';
import { GetMessagesArgs } from '../dtos/get-messages.args';
import { SendMessageToTeacherInput } from '../dtos/send-message.input';

@Injectable()
export class StudentChatProvider {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Get student by user_id
   */
  async getStudentByUserId(
    userId: string,
    tenantId: string,
  ): Promise<any> {
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

  /**
   * Get teacher by teacher.id (not user_id)
   */
  async getTeacherById(teacherId: string, tenantId: string): Promise<any> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    try {
      const query = `
        SELECT t.*, t.user_id, u.name AS user_name, u.email
        FROM teacher t
        JOIN users u ON t.user_id = u.id
        WHERE t.id = $1 AND t.tenant_id = $2
      `;
      const result = await qr.query(query, [teacherId, tenantId]);
      return result[0] || null;
    } finally {
      await qr.release();
    }
  }

  /**
   * Get chat rooms for a student using the simple-array participantIds structure
   */
  async getChatRoomsByUserId(
    userId: string,
    tenantId: string,
    roomType: string,
    args: GetChatRoomsArgs,
  ): Promise<{ chatRooms: ChatRoomInput[]; total: number }> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();

    try {
      // Verify user exists in tenant
      const userCheck = await qr.query(
        `SELECT u.*,
          utm.role,
          utm.status,
          utm.permissions,
          utm."tenantId"
         FROM users u
         JOIN user_tenant_memberships utm ON utm."userId" = u.id
         WHERE u.id = $1 AND utm."tenantId" = $2`,
        [userId, tenantId],
      );

      if (!userCheck.length) {
        throw new Error('User not found in tenant');
      }

      // Count total rooms where user is a participant (using simple-array)
      const countQuery = `
        SELECT COUNT(*) as total
        FROM chat_rooms cr
        WHERE $1 = ANY(string_to_array(cr."participantIds", ','))
          AND cr.type = $2
      `;
      const countResult = await qr.query(countQuery, [userId, roomType]);
      const total = parseInt(countResult[0].total, 10);

      // Fetch chat rooms with last message and unread count
      const chatRoomsQuery = `
        SELECT DISTINCT
          cr.id,
          cr.name,
          cr.type as room_type,
          cr."createdAt" as created_at,
          cr."updatedAt" as updated_at,
          cr."participantIds",
          lm.id as last_message_id,
          lm.message as last_message_text,
          lm.subject as last_message_subject,
          lm."imageUrl" as last_message_image_url,
          lm."createdAt" as last_message_created_at,
          lm."senderId" as last_message_sender_id,
          lm."senderType" as last_message_sender_type,
          lm_sender.name as last_message_sender_name,
          lm_sender.email as last_message_sender_email,
          COALESCE(unread.unread_count, 0) as unread_count
        FROM chat_rooms cr
        LEFT JOIN LATERAL (
          SELECT cm.*
          FROM chat_messages cm
          WHERE cm."chatRoomId" = cr.id
          ORDER BY cm."createdAt" DESC
          LIMIT 1
        ) lm ON true
        LEFT JOIN users lm_sender ON lm."senderId" = lm_sender.id
        LEFT JOIN LATERAL (
          SELECT COUNT(*) as unread_count
          FROM chat_messages cm2
          WHERE cm2."chatRoomId" = cr.id
            AND cm2."senderId" != $1
            AND cm2."isRead" = false
        ) unread ON true
        WHERE $1 = ANY(string_to_array(cr."participantIds", ','))
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

      const chatRooms: ChatRoomInput[] = [];

      for (const row of chatRoomsResult) {
        // Parse participantIds from the simple-array column
        const participantUserIds = row.participantIds
          ? row.participantIds.split(',')
          : [];

        // Get participant details
        const participantsQuery = `
          SELECT
            u.id as user_id,
            u.name as user_name,
            u.email,
            s.id as student_id,
            t.id as teacher_id,
            CASE
              WHEN s.id IS NOT NULL THEN 'STUDENT'
              WHEN t.id IS NOT NULL THEN 'TEACHER'
              ELSE 'UNKNOWN'
            END as user_type
          FROM users u
          LEFT JOIN students s ON s.user_id = u.id AND s.tenant_id = $1
          LEFT JOIN teacher t ON t.user_id = u.id AND t.tenant_id = $1
          WHERE u.id = ANY($2::uuid[])
        `;
        const participantsResult = await qr.query(participantsQuery, [
          tenantId,
          participantUserIds,
        ]);

        const participants: ChatUser[] = participantsResult.map((p) => {
          const nameParts = (p.user_name || '').split(' ');
          return {
            id: p.user_id,
            studentId: p.student_id,
            teacherId: p.teacher_id,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            email: p.email,
            userType: p.user_type,
          };
        });

        const chatRoom: ChatRoomInput = {
          id: row.id,
          name: row.name,
          roomType: row.room_type,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
          participants,
          unreadCount: parseInt(row.unread_count, 10),
          lastMessage: undefined,
        };

        if (row.last_message_id) {
          const senderNameParts = (row.last_message_sender_name || '').split(' ');
          chatRoom.lastMessage = {
            id: row.last_message_id,
            message: row.last_message_text,
            subject: row.last_message_subject,
            imageUrl: row.last_message_image_url,
            createdAt: new Date(row.last_message_created_at),
            sender: {
              id: row.last_message_sender_id,
              firstName: senderNameParts[0] || '',
              lastName: senderNameParts.slice(1).join(' ') || '',
              email: row.last_message_sender_email,
              userType: row.last_message_sender_type,
            },
            chatRoom: chatRoom,
            isRead: false,
          };
        }

        chatRooms.push(chatRoom);
      }

      return { chatRooms, total };
    } finally {
      await qr.release();
    }
  }

  /**
   * Get messages for a chat room or teacher
   */
  async getMessages(
    userId: string,
    tenantId: string,
    args: GetMessagesArgs,
  ): Promise<{ messages: ChatMessageInput[]; total: number; chatRoom: ChatRoomInput }> {
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

        if (roomResult.length === 0) {
          // Return empty response if no chat room exists yet
          return {
            messages: [],
            total: 0,
            chatRoom: null as any,
          };
        }

        chatRoomId = roomResult[0].id;
      }

      if (!chatRoomId) {
        throw new Error('Either chatRoomId or teacherId must be provided');
      }

      // Verify user is participant in this chat room
      const verifyQuery = `
        SELECT id, name, type, "participantIds", "createdAt", "updatedAt"
        FROM chat_rooms
        WHERE id = $1
          AND $2 = ANY(string_to_array("participantIds", ','))
      `;
      const roomResult = await qr.query(verifyQuery, [chatRoomId, userId]);

      if (roomResult.length === 0) {
        throw new Error('Chat room not found or access denied');
      }

      const room = roomResult[0];

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
          cm."imageUrl",
          cm."createdAt",
          cm."isRead",
          cm."senderId",
          cm."senderType",
          u.name as sender_name,
          u.email as sender_email
        FROM chat_messages cm
        JOIN users u ON cm."senderId" = u.id
        WHERE cm."chatRoomId" = $1
        ORDER BY cm."createdAt" DESC
        LIMIT $2 OFFSET $3
      `;

      const messagesResult = await qr.query(messagesQuery, [
        chatRoomId,
        args.limit || 20,
        args.offset || 0,
      ]);

      // Get participants for chat room
      const participantIds = room.participantIds.split(',');
      const participantsQuery = `
        SELECT
          u.id,
          u.name,
          u.email,
          CASE
            WHEN EXISTS(SELECT 1 FROM students WHERE user_id = u.id) THEN 'STUDENT'
            WHEN EXISTS(SELECT 1 FROM teacher WHERE user_id = u.id) THEN 'TEACHER'
            ELSE 'UNKNOWN'
          END as user_type
        FROM users u
        WHERE u.id = ANY($1::uuid[])
      `;
      const participantsResult = await qr.query(participantsQuery, [participantIds]);

      const participants: ChatUser[] = participantsResult.map((p) => {
        const nameParts = (p.name || '').split(' ');
        return {
          id: p.id,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: p.email,
          userType: p.user_type,
        };
      });

      const chatRoom: ChatRoomInput = {
        id: room.id,
        name: room.name,
        roomType: room.type,
        createdAt: new Date(room.createdAt),
        updatedAt: new Date(room.updatedAt),
        participants,
      };

      const messages: ChatMessageInput[] = messagesResult.map((msg) => {
        const senderNameParts = (msg.sender_name || '').split(' ');
        return {
          id: msg.id,
          message: msg.message,
          subject: msg.subject,
          imageUrl: msg.imageUrl,
          createdAt: new Date(msg.createdAt),
          isRead: msg.isRead,
          sender: {
            id: msg.senderId,
            firstName: senderNameParts[0] || '',
            lastName: senderNameParts.slice(1).join(' ') || '',
            email: msg.sender_email,
            userType: msg.senderType,
          },
          chatRoom,
        };
      });

      return { messages, total, chatRoom };
    } finally {
      await qr.release();
    }
  }

  /**
   * Find or create chat room (using simple-array participantIds)
   */
  async findOrCreateChatRoom(
    participantUserIds: string[],
    roomType: string,
    roomName: string,
  ): Promise<ChatRoomInput> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();

    try {
      // Sort IDs for consistent comparison
      const sortedIds = participantUserIds.sort();
      const participantIdsString = sortedIds.join(',');

      // Try to find existing chat room
      const findRoomQuery = `
        SELECT id, name, type as room_type, "createdAt" as created_at, "updatedAt" as updated_at, "participantIds"
        FROM chat_rooms
        WHERE type = $1
          AND "participantIds" = $2
        LIMIT 1
      `;

      const existingRooms = await qr.query(findRoomQuery, [
        roomType,
        participantIdsString,
      ]);

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
              ELSE 'UNKNOWN'
            END as user_type
          FROM users u
          WHERE u.id = ANY($1::uuid[])
        `;
        const participantsResult = await qr.query(participantsQuery, [sortedIds]);

        const participants: ChatUser[] = participantsResult.map((p) => {
          const nameParts = (p.name || '').split(' ');
          return {
            id: p.id,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            email: p.email,
            userType: p.user_type,
          };
        });

        return {
          id: room.id,
          name: room.name,
          roomType: room.room_type,
          createdAt: new Date(room.created_at),
          updatedAt: new Date(room.updated_at),
          participants,
        };
      }

      // Create new chat room
      const roomId = require('uuid').v4();
      const createRoomQuery = `
        INSERT INTO chat_rooms (id, name, type, "participantIds", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $5)
        RETURNING *
      `;

      const now = new Date();
      const roomResult = await qr.query(createRoomQuery, [
        roomId,
        roomName,
        roomType,
        participantIdsString,
        now,
      ]);

      const room = roomResult[0];

      // Get participants
      const participantsQuery = `
        SELECT
          u.id,
          u.name,
          u.email,
          CASE
            WHEN EXISTS(SELECT 1 FROM students WHERE user_id = u.id) THEN 'STUDENT'
            WHEN EXISTS(SELECT 1 FROM teacher WHERE user_id = u.id) THEN 'TEACHER'
            ELSE 'UNKNOWN'
          END as user_type
        FROM users u
        WHERE u.id = ANY($1::uuid[])
      `;
      const participantsResult = await qr.query(participantsQuery, [sortedIds]);

      const participants: ChatUser[] = participantsResult.map((p) => {
        const nameParts = (p.name || '').split(' ');
        return {
          id: p.id,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: p.email,
          userType: p.user_type,
        };
      });

      return {
        id: room.id,
        name: room.name,
        roomType: room.type,
        createdAt: new Date(room.createdAt),
        updatedAt: new Date(room.updatedAt),
        participants,
      };
    } finally {
      await qr.release();
    }
  }

  /**
   * Create a message
   */
  async createMessage(
    senderId: string,
    senderType: string,
    chatRoomId: string,
    messageData: Partial<SendMessageToTeacherInput>,
  ): Promise<any> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();

    try {
      const messageId = require('uuid').v4();
      const insertMessageQuery = `
        INSERT INTO chat_messages (
          id, "chatRoomId", "senderId", "senderType", message, subject, "imageUrl", "createdAt", "isRead"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const now = new Date();
      const messageResult = await qr.query(insertMessageQuery, [
        messageId,
        chatRoomId,
        senderId,
        senderType,
        messageData.message,
        messageData.subject,
        messageData.imageUrl,
        now,
        false,
      ]);

      // Update chat room's updatedAt
      await qr.query(
        `UPDATE chat_rooms SET "updatedAt" = $1 WHERE id = $2`,
        [now, chatRoomId],
      );

      return messageResult[0];
    } finally {
      await qr.release();
    }
  }
}
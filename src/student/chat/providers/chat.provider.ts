// src/chat/providers/chat.provider.ts
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GetChatRoomsArgs } from '../dtos/get-chat-rooms.args';
import { ChatUser, ChatMessage, MessagesResponse, ChatRoom } from '../dtos/chat-response.dto';
import { GetMessagesArgs } from '../dtos/get-messages.args';
import { SendMessageToTeacherInput } from '../dtos/send-message.input';
// import { ChatRoom } from 'src/messaging/entities/chat-room.entity';

@Injectable()
export class ChatProvider {
  constructor(private readonly dataSource: DataSource) {}

  async getStudentChatRooms(
    studentId: string,
    tenantId: string,
    args: GetChatRoomsArgs,
  ): Promise<{ chatRooms: ChatRoom[]; total: number }> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();

    try {
      // Get student's user ID
      const studentQuery = `
        SELECT s.user_id, s.id as student_id
        FROM students s
        WHERE s.user_id = $1 AND s.tenant_id = $2
      `;
      const studentResult = await qr.query(studentQuery, [studentId, tenantId]);
      
      if (!studentResult.length) {
        throw new Error('Student not found');
      }

      const studentUserId = studentResult[0].user_id;

      // Get total count
      const countQuery = `
        SELECT COUNT(DISTINCT cr.id) as total
        FROM chat_rooms cr
        JOIN chat_room_participants crp ON cr.id = crp.chat_room_id
        WHERE crp.user_id = $1 AND cr.room_type = 'TEACHER_STUDENT'
      `;
      const countResult = await qr.query(countQuery, [studentUserId]);
      const total = parseInt(countResult[0].total);

      // Get chat rooms with last message and unread count
      const chatRoomsQuery = `
        SELECT DISTINCT
          cr.id,
          cr.name,
          cr.room_type,
          cr.created_at,
          cr.updated_at,
          lm.id as last_message_id,
          lm.message as last_message_text,
          lm.subject as last_message_subject,
          lm.image_url as last_message_image_url,
          lm.created_at as last_message_created_at,
          lm_sender.id as last_message_sender_id,
          lm_sender.first_name as last_message_sender_first_name,
          lm_sender.last_name as last_message_sender_last_name,
          lm_sender.email as last_message_sender_email,
          CASE 
            WHEN EXISTS(SELECT 1 FROM students WHERE user_id = lm_sender.id) THEN 'STUDENT'
            ELSE 'TEACHER'
          END as last_message_sender_type,
          COALESCE(unread.unread_count, 0) as unread_count
        FROM chat_rooms cr
        JOIN chat_room_participants crp ON cr.id = crp.chat_room_id
        LEFT JOIN LATERAL (
          SELECT cm.* 
          FROM chat_messages cm 
          WHERE cm.chat_room_id = cr.id 
          ORDER BY cm.created_at DESC 
          LIMIT 1
        ) lm ON true
        LEFT JOIN users lm_sender ON lm.sender_id = lm_sender.id
        LEFT JOIN LATERAL (
          SELECT COUNT(*) as unread_count
          FROM chat_messages cm2
          WHERE cm2.chat_room_id = cr.id 
            AND cm2.sender_id != $1
            AND cm2.is_read = false
        ) unread ON true
        WHERE crp.user_id = $1 AND cr.room_type = 'TEACHER_STUDENT'
        ORDER BY COALESCE(lm.created_at, cr.created_at) DESC
        LIMIT $2 OFFSET $3
      `;

      const chatRoomsResult = await qr.query(chatRoomsQuery, [
        studentUserId,
        args.limit,
        args.offset,
      ]);

      const chatRooms: ChatRoom[] = [];

      for (const row of chatRoomsResult) {
        // Get participants for each chat room
        const participantsQuery = `
          SELECT
            u.id,
            u.first_name,
            u.last_name,
            u.email,
            CASE
              WHEN EXISTS(SELECT 1 FROM students WHERE user_id = u.id) THEN 'STUDENT'
              ELSE 'TEACHER'
            END as user_type
          FROM chat_room_participants crp
          JOIN users u ON crp.user_id = u.id
          WHERE crp.chat_room_id = $1
        `;
        const participantsResult = await qr.query(participantsQuery, [row.id]);

        const participants: ChatUser[] = participantsResult.map(p => ({
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          email: p.email,
          userType: p.user_type,
        }));

        // Declare chatRoom here so it's available for lastMessage.chatRoom
        const chatRoom: ChatRoom = {
            id: row.id,
            name: row.name,
            roomType: row.room_type,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            participants,
            unreadCount: parseInt(row.unread_count),
            // lastMessage will be assigned correctly below
            lastMessage: undefined // Initialize as undefined
        };

        if (row.last_message_id) {
            chatRoom.lastMessage = {
                id: row.last_message_id,
                message: row.last_message_text,
                subject: row.last_message_subject,
                imageUrl: row.last_message_image_url,
                createdAt: new Date(row.last_message_created_at),
                sender: {
                    id: row.last_message_sender_id,
                    firstName: row.last_message_sender_first_name,
                    lastName: row.last_message_sender_last_name,
                    email: row.last_message_sender_email,
                    userType: row.last_message_sender_type,
                },
                chatRoom: chatRoom, // <--- Assign the current chatRoom object here!
                isRead: false, // This would need additional logic to determine
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
    studentId: string,
    tenantId: string,
    args: GetMessagesArgs,
  ): Promise<MessagesResponse> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();

    try {
      // Get student's user ID
      const studentQuery = `
        SELECT s.user_id
        FROM students s
        WHERE s.user_id = $1 AND s.tenant_id = $2
      `;
      const studentResult = await qr.query(studentQuery, [studentId, tenantId]);
      
      if (!studentResult.length) {
        throw new Error('Student not found');
      }

      const studentUserId = studentResult[0].user_id;
      let chatRoomId = args.chatRoomId;

      // If teacherId is provided but no chatRoomId, find or create the chat room
      if (args.teacherId && !chatRoomId) {
        const chatRoom = await this.findOrCreateChatRoom(
          [studentUserId, args.teacherId],
          'TEACHER_STUDENT',
          'Teacher-Student Chat',
        );
        chatRoomId = chatRoom.id;
      }

      if (!chatRoomId) {
        throw new Error('Chat room ID or teacher ID is required');
      }

      // Verify user has access to this chat room
      const accessQuery = `
        SELECT 1
        FROM chat_room_participants crp
        WHERE crp.chat_room_id = $1 AND crp.user_id = $2
      `;
      const accessResult = await qr.query(accessQuery, [chatRoomId, studentUserId]);
      
      if (!accessResult.length) {
        throw new Error('Access denied to this chat room');
      }

      // Get total message count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM chat_messages cm
        WHERE cm.chat_room_id = $1
      `;
      const countResult = await qr.query(countQuery, [chatRoomId]);
      const total = parseInt(countResult[0].total);

      // Get messages
      const messagesQuery = `
        SELECT 
          cm.id,
          cm.message,
          cm.subject,
          cm.image_url,
          cm.created_at,
          cm.is_read,
          sender.id as sender_id,
          sender.first_name as sender_first_name,
          sender.last_name as sender_last_name,
          sender.email as sender_email,
          CASE 
            WHEN EXISTS(SELECT 1 FROM students WHERE user_id = sender.id) THEN 'STUDENT'
            ELSE 'TEACHER'
          END as sender_type
        FROM chat_messages cm
        JOIN users sender ON cm.sender_id = sender.id
        WHERE cm.chat_room_id = $1
        ORDER BY cm.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const messagesResult = await qr.query(messagesQuery, [
        chatRoomId,
        args.limit,
        args.offset,
      ]);

      // Get chat room info
      const chatRoomQuery = `
        SELECT 
          cr.id,
          cr.name,
          cr.room_type,
          cr.created_at,
          cr.updated_at
        FROM chat_rooms cr
        WHERE cr.id = $1
      `;
      const chatRoomResult = await qr.query(chatRoomQuery, [chatRoomId]);
      const chatRoomRow = chatRoomResult[0];

      // Get participants
      const participantsQuery = `
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          CASE 
            WHEN EXISTS(SELECT 1 FROM students WHERE user_id = u.id) THEN 'STUDENT'
            ELSE 'TEACHER'
          END as user_type
        FROM chat_room_participants crp
        JOIN users u ON crp.user_id = u.id
        WHERE crp.chat_room_id = $1
      `;
      const participantsResult = await qr.query(participantsQuery, [chatRoomId]);

      const chatRoom: ChatRoom = {
        id: chatRoomRow.id,
        name: chatRoomRow.name,
        roomType: chatRoomRow.room_type,
        createdAt: new Date(chatRoomRow.created_at),
        updatedAt: new Date(chatRoomRow.updated_at),
        participants: participantsResult.map(p => ({
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          email: p.email,
          userType: p.user_type,
        })),
      };

      const messages: ChatMessage[] = messagesResult.map(row => ({
        id: row.id,
        message: row.message,
        subject: row.subject,
        imageUrl: row.image_url,
        createdAt: new Date(row.created_at),
        isRead: row.is_read,
        sender: {
          id: row.sender_id,
          firstName: row.sender_first_name,
          lastName: row.sender_last_name,
          email: row.sender_email,
          userType: row.sender_type,
        },
        chatRoom,
      }));

      // Mark messages as read for this user
      await this.markMessagesAsRead(chatRoomId, studentUserId);

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

  async sendMessageToTeacher(
    studentId: string,
    tenantId: string,
    input: SendMessageToTeacherInput,
  ): Promise<ChatMessage> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // Get student's user ID
      const studentQuery = `
        SELECT s.user_id
        FROM students s
        WHERE s.user_id = $1 AND s.tenant_id = $2
      `;
      const studentResult = await qr.query(studentQuery, [studentId, tenantId]);
      
      if (!studentResult.length) {
        throw new Error('Student not found');
      }

      const studentUserId = studentResult[0].user_id;

      // Verify teacher exists and belongs to same tenant
      const teacherQuery = `
        SELECT u.id
        FROM users u
        WHERE u.id = $1 AND u.tenant_id = $2
          AND EXISTS(SELECT 1 FROM teachers WHERE user_id = u.id)
      `;
      const teacherResult = await qr.query(teacherQuery, [input.recipientId, tenantId]);
      
      if (!teacherResult.length) {
        throw new Error('Teacher not found or not in same tenant');
      }

      // Find or create chat room
      const chatRoom = await this.findOrCreateChatRoom(
        [studentUserId, input.recipientId],
        'TEACHER_STUDENT',
        'Teacher-Student Chat',
      );

      // Create message
      const messageId = require('uuid').v4();
      const insertMessageQuery = `
        INSERT INTO chat_messages (
          id, chat_room_id, sender_id, sender_type, message, subject, image_url, created_at, is_read
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const now = new Date();
      const messageResult = await qr.query(insertMessageQuery, [
        messageId,
        chatRoom.id,
        studentUserId,
        'STUDENT',
        input.message,
        input.subject,
        input.imageUrl,
        now,
        false,
      ]);

      await qr.commitTransaction();

      const messageRow = messageResult[0];

      // Get sender info
      const senderQuery = `
        SELECT id, first_name, last_name, email
        FROM users
        WHERE id = $1
      `;
      const senderResult = await qr.query(senderQuery, [studentUserId]);
      const sender = senderResult[0];

      return {
        id: messageRow.id,
        message: messageRow.message,
        subject: messageRow.subject,
        imageUrl: messageRow.image_url,
        createdAt: new Date(messageRow.created_at),
        isRead: messageRow.is_read,
        sender: {
          id: sender.id,
          firstName: sender.first_name,
          lastName: sender.last_name,
          email: sender.email,
          userType: 'STUDENT',
        },
        chatRoom,
      };
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
    } finally {
      await qr.release();
    }
  }

  async findOrCreateChatRoom(
    participantIds: string[],
    roomType: string,
    roomName: string,
  ): Promise<ChatRoom> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // Try to find existing chat room
      const findRoomQuery = `
        SELECT cr.id, cr.name, cr.room_type, cr.created_at, cr.updated_at
        FROM chat_rooms cr
        WHERE cr.room_type = $1
          AND (
            SELECT COUNT(*)
            FROM chat_room_participants crp
            WHERE crp.chat_room_id = cr.id
          ) = $2
          AND cr.id IN (
            SELECT crp.chat_room_id
            FROM chat_room_participants crp
            WHERE crp.user_id = ANY($3)
            GROUP BY crp.chat_room_id
            HAVING COUNT(crp.user_id) = $2
          )
      `;

      const existingRooms = await qr.query(findRoomQuery, [
        roomType,
        participantIds.length,
        participantIds,
      ]);

      if (existingRooms.length > 0) {
        const room = existingRooms[0];
        await qr.commitTransaction();
        
        // Get participants
        const participantsQuery = `
          SELECT 
            u.id,
            u.first_name,
            u.last_name,
            u.email,
            CASE 
              WHEN EXISTS(SELECT 1 FROM students WHERE user_id = u.id) THEN 'STUDENT'
              ELSE 'TEACHER'
            END as user_type
          FROM chat_room_participants crp
          JOIN users u ON crp.user_id = u.id
          WHERE crp.chat_room_id = $1
        `;
        const participantsResult = await qr.query(participantsQuery, [room.id]);

        return {
          id: room.id,
          name: room.name,
          roomType: room.room_type,
          createdAt: new Date(room.created_at),
          updatedAt: new Date(room.updated_at),
          participants: participantsResult.map(p => ({
            id: p.id,
            firstName: p.first_name,
            lastName: p.last_name,
            email: p.email,
            userType: p.user_type,
          })),
        };
      }

      // Create new chat room
      const roomId = require('uuid').v4();
      const createRoomQuery = `
        INSERT INTO chat_rooms (id, name, room_type, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $4)
        RETURNING *
      `;

      const now = new Date();
      const roomResult = await qr.query(createRoomQuery, [
        roomId,
        roomName,
        roomType,
        now,
      ]);

      // Add participants
      for (const participantId of participantIds) {
        const addParticipantQuery = `
          INSERT INTO chat_room_participants (chat_room_id, user_id)
          VALUES ($1, $2)
        `;
        await qr.query(addParticipantQuery, [roomId, participantId]);
      }

      await qr.commitTransaction();

      const room = roomResult[0];
      
      // Get participants
      const participantsQuery = `
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.email,
          CASE 
            WHEN EXISTS(SELECT 1 FROM students WHERE user_id = u.id) THEN 'STUDENT'
            ELSE 'TEACHER'
          END as user_type
        FROM chat_room_participants crp
        JOIN users u ON crp.user_id = u.id
        WHERE crp.chat_room_id = $1
      `;
      const participantsResult = await qr.query(participantsQuery, [roomId]);

      return {
        id: room.id,
        name: room.name,
        roomType: room.room_type,
        createdAt: new Date(room.created_at),
        updatedAt: new Date(room.updated_at),
        participants: participantsResult.map(p => ({
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          email: p.email,
          userType: p.user_type,
        })),
      };
    } catch (error) {
      await qr.rollbackTransaction();
      throw error;
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
        SET is_read = true
        WHERE chat_room_id = $1 AND sender_id != $2 AND is_read = false
      `;
      await qr.query(updateQuery, [chatRoomId, userId]);
    } finally {
      await qr.release();
    }
  }

  async getStudentById(studentId: string, tenantId: string): Promise<any> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();

    try {
      const query = `
        SELECT s.*, u.first_name, u.last_name, u.email
        FROM students s
        JOIN users u ON s.user_id = u.id
        WHERE s.user_id = $1 AND s.tenant_id = $2
      `;
      const result = await qr.query(query, [studentId, tenantId]);
      return result[0] || null;
    } finally {
      await qr.release();
    }
  }
}
  
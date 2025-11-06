import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { RedisChatProvider } from '../providers/redis-chat.provider';
import { ChatService } from '../providers/chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly redisChatProvider: RedisChatProvider,
  ) {}

  /**
   * Handle new WebSocket connection
   */
  async handleConnection(client: Socket) {
    try {
      const userId = client.handshake.query.userId as string;
      
      if (!userId) {
        this.logger.warn('Connection attempt without userId');
        client.disconnect();
        return;
      }

      // Mark user as online in Redis
      await this.redisChatProvider.setUserOnline(userId);
      
      // Join user to their personal room for direct notifications
      client.join(`user:${userId}`);
      
      this.logger.log(`User ${userId} connected with socket ${client.id}`);
      
      // Notify user of their unread count
      const unreadCount = await this.chatService.getUnreadCount(userId);
      client.emit('unreadCount', { count: unreadCount });
      
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  /**
   * Handle WebSocket disconnection
   */
  async handleDisconnect(client: Socket) {
    try {
      const userId = client.handshake.query.userId as string;
      
      if (userId) {
        // Leave current room if any
        const currentRoom = await this.redisChatProvider.getUserCurrentRoom(userId);
        if (currentRoom) {
          await this.redisChatProvider.removeUserFromRoom(userId, currentRoom);
          
          // Notify room that user left
          this.server.to(currentRoom).emit('userLeft', { userId });
        }
        
        this.logger.log(`User ${userId} disconnected`);
      }
    } catch (error) {
      this.logger.error('Disconnect error:', error);
    }
  }

  /**
   * Join a chat room
   * 
   * Usage: socket.emit('joinRoom', { roomId: 'room-uuid' })
   */
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.handshake.query.userId as string;
      
      if (!userId || !data.roomId) {
        client.emit('error', { message: 'Invalid userId or roomId' });
        return;
      }

      // Leave previous room if any
      const currentRoom = await this.redisChatProvider.getUserCurrentRoom(userId);
      if (currentRoom && currentRoom !== data.roomId) {
        await client.leave(currentRoom);
        await this.redisChatProvider.removeUserFromRoom(userId, currentRoom);
      }

      // Join new room
      await client.join(data.roomId);
      await this.redisChatProvider.addUserToRoom(userId, data.roomId);

      // Get room users
      const roomUsers = await this.redisChatProvider.getRoomUsers(data.roomId);

      // Notify user they joined successfully
      client.emit('joinedRoom', { 
        roomId: data.roomId,
        users: roomUsers,
      });

      // Notify other users in room
      client.to(data.roomId).emit('userJoined', { 
        userId,
        roomId: data.roomId,
      });

      this.logger.log(`User ${userId} joined room ${data.roomId}`);
      
    } catch (error) {
      this.logger.error('Join room error:', error);
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  /**
   * Leave a chat room
   * 
   * Usage: socket.emit('leaveRoom', { roomId: 'room-uuid' })
   */
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.handshake.query.userId as string;
      
      await client.leave(data.roomId);
      await this.redisChatProvider.removeUserFromRoom(userId, data.roomId);

      // Notify user they left
      client.emit('leftRoom', { roomId: data.roomId });

      // Notify other users
      client.to(data.roomId).emit('userLeft', { 
        userId,
        roomId: data.roomId,
      });

      this.logger.log(`User ${userId} left room ${data.roomId}`);
      
    } catch (error) {
      this.logger.error('Leave room error:', error);
      client.emit('error', { message: 'Failed to leave room' });
    }
  }

  /**
   * Handle typing indicator
   * 
   * Usage: socket.emit('typing', { roomId: 'room-uuid', isTyping: true })
   */
  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { roomId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.handshake.query.userId as string;

      // Build an ActiveUserData-like object and store typing status in Redis
      const currentUser = { sub: userId } as any;
      await this.redisChatProvider.setTypingIndicator(
        currentUser,
        data.roomId,
        data.isTyping,
      );

      // Broadcast to other users in room
      client.to(data.roomId).emit('userTyping', {
        userId,
        isTyping: data.isTyping,
        roomId: data.roomId,
      });
      
    } catch (error) {
      this.logger.error('Typing indicator error:', error);
    }
  }

  /**
   * Send a message via WebSocket
   * 
   * Usage: socket.emit('sendMessage', { roomId: 'room-uuid', message: 'Hello', subject?: 'Subject' })
   */
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { 
      roomId: string; 
      message: string; 
      subject?: string;
      imageUrl?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.handshake.query.userId as string;

      // Validate room membership
      const roomUsers = await this.redisChatProvider.getRoomUsers(data.roomId);
      if (!roomUsers.includes(userId)) {
        client.emit('error', { message: 'Not a member of this room' });
        return;
      }

      // Create message (you'll need to implement this based on your needs)
      const messageData = {
        senderId: userId,
        chatRoomId: data.roomId,
        message: data.message,
        subject: data.subject,
        imageUrl: data.imageUrl,
        createdAt: new Date(),
      };

      // Cache message
      await this.redisChatProvider.cacheMessage(messageData);

      // Broadcast to all users in room
      this.server.to(data.roomId).emit('messageReceived', messageData);

      // Update unread counts for other users
      for (const otherUserId of roomUsers) {
        if (otherUserId !== userId) {
          await this.redisChatProvider.incrementUnreadCount(otherUserId, data.roomId);
          
          // Notify user of new unread count
          this.server.to(`user:${otherUserId}`).emit('unreadCountUpdated', {
            roomId: data.roomId,
            count: await this.redisChatProvider.getUnreadCount(otherUserId, data.roomId),
          });
        }
      }

      this.logger.log(`Message sent in room ${data.roomId} by user ${userId}`);
      
    } catch (error) {
      this.logger.error('Send message error:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  /**
   * Mark messages as read
   * 
   * Usage: socket.emit('markAsRead', { roomId: 'room-uuid' })
   */
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.handshake.query.userId as string;

      await this.redisChatProvider.clearUnreadCount(userId, data.roomId);

      client.emit('markedAsRead', { roomId: data.roomId });

      // Get total unread count
      const totalUnread = await this.chatService.getUnreadCount(userId);
      client.emit('unreadCount', { count: totalUnread });

      this.logger.log(`User ${userId} marked room ${data.roomId} as read`);
      
    } catch (error) {
      this.logger.error('Mark as read error:', error);
      client.emit('error', { message: 'Failed to mark as read' });
    }
  }

  /**
   * Get online status of users
   * 
   * Usage: socket.emit('checkOnlineStatus', { userIds: ['user1', 'user2'] })
   */
  @SubscribeMessage('checkOnlineStatus')
  async handleCheckOnlineStatus(
    @MessageBody() data: { userIds: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const onlineStatus: Record<string, boolean> = {};

      for (const userId of data.userIds) {
        onlineStatus[userId] = await this.redisChatProvider.isUserOnline(userId);
      }

      client.emit('onlineStatus', onlineStatus);
      
    } catch (error) {
      this.logger.error('Check online status error:', error);
      client.emit('error', { message: 'Failed to check online status' });
    }
  }

  /**
   * Emit a message to a specific user (for direct notifications)
   */
  async notifyUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Emit a message to a specific room
   */
  async notifyRoom(roomId: string, event: string, data: any) {
    this.server.to(roomId).emit(event, data);
  }
}
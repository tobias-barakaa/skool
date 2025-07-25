import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { RedisChatProvider } from '../providers/redis-chat.provider';
import { ChatService } from '../providers/chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly chatService: ChatService,
    private readonly redisChatProvider: RedisChatProvider,
  ) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      client.join(`user:${userId}`);
      console.log(`User ${userId} connected`);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      const currentRoom = await this.redisChatProvider.getUserCurrentRoom(userId);
      if (currentRoom) {
        await this.redisChatProvider.removeUserFromRoom(userId, currentRoom);
      }
      console.log(`User ${userId} disconnected`);
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.query.userId as string;
    await client.join(data.roomId);
    await this.redisChatProvider.addUserToRoom(userId, data.roomId);

    client.emit('joinedRoom', { roomId: data.roomId });
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.query.userId as string;
    await client.leave(data.roomId);
    await this.redisChatProvider.removeUserFromRoom(userId, data.roomId);

    client.emit('leftRoom', { roomId: data.roomId });
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { roomId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.query.userId as string;
    client.to(data.roomId).emit('userTyping', {
      userId,
      isTyping: data.isTyping,
    });
  }
}

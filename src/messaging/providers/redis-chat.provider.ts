import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisChatProvider {
  private readonly logger = new Logger(RedisChatProvider.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  async addUserToRoom(userId: string, roomId: string): Promise<void> {
    await this.redis.sadd(`room:${roomId}:users`, userId);
    await this.redis.set(`user:${userId}:current_room`, roomId);
  }

  async removeUserFromRoom(userId: string, roomId: string): Promise<void> {
    await this.redis.srem(`room:${roomId}:users`, userId);
    await this.redis.del(`user:${userId}:current_room`);
  }

  async getRoomUsers(roomId: string): Promise<string[]> {
    return await this.redis.smembers(`room:${roomId}:users`);
  }

  async getUserCurrentRoom(userId: string): Promise<string | null> {
    return await this.redis.get(`user:${userId}:current_room`);
  }

  async cacheMessage(message: any): Promise<void> {
    const key = `room:${message.chatRoomId}:recent_messages`;
    await this.redis.lpush(key, JSON.stringify(message));
    await this.redis.ltrim(key, 0, 99);
    await this.redis.expire(key, 3600);
  }

  async getRecentMessages(roomId: string): Promise<any[]> {
    const messages = await this.redis.lrange(
      `room:${roomId}:recent_messages`,
      0,
      -1,
    );
    return messages.map((msg) => JSON.parse(msg));
  }
}

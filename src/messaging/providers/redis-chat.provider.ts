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




  async setUserOnline(userId: string): Promise<void> {
    const key = 'online:users';
    await this.redis.sadd(key, userId);
    await this.redis.set(`user:${userId}:last_seen`, Date.now());
    await this.redis.expire(`user:${userId}:last_seen`, 60 * 60 * 24); // keep 24h last seen
  }

  async setUserOffline(userId: string): Promise<void> {
    const key = 'online:users';
    await this.redis.srem(key, userId);
    await this.redis.set(`user:${userId}:last_seen`, Date.now());
  }

  async isUserOnline(userId: string): Promise<boolean> {
    return (await this.redis.sismember('online:users', userId)) === 1;
  }

  /** -----------------------------
   * ✍️ TYPING INDICATOR
   * ----------------------------- */

  async setTypingIndicator(
    userId: string,
    roomId: string,
    isTyping: boolean,
  ): Promise<void> {
    const key = `room:${roomId}:typing`;
    if (isTyping) {
      await this.redis.sadd(key, userId);
      await this.redis.expire(key, 30); // expires after 30s inactivity
    } else {
      await this.redis.srem(key, userId);
    }
  }

  async getTypingUsers(roomId: string): Promise<string[]> {
    return await this.redis.smembers(`room:${roomId}:typing`);
  }

  /** -----------------------------
   * 💬 UNREAD MESSAGE TRACKING
   * ----------------------------- */

  async incrementUnreadCount(userId: string, roomId: string): Promise<void> {
    await this.redis.hincrby(`user:${userId}:unread_counts`, roomId, 1);
  }

  async getUnreadCount(userId: string, roomId: string): Promise<number> {
    const count = await this.redis.hget(
      `user:${userId}:unread_counts`,
      roomId,
    );
    return count ? parseInt(count, 10) : 0;
  }

  async clearUnreadCount(userId: string, roomId: string): Promise<void> {
    await this.redis.hdel(`user:${userId}:unread_counts`, roomId);
  }

  async getTotalUnreadCount(userId: string): Promise<number> {
    const counts = await this.redis.hvals(`user:${userId}:unread_counts`);
    return counts.reduce((sum, val) => sum + parseInt(val, 10), 0);
  }

  // redis-chat.provider.ts
async getUserLastSeen(userId: string): Promise<number | null> {
  const timestamp = await this.redis.get(`user:${userId}:last_seen`);
  return timestamp ? Number(timestamp) : null;
}

async getUnreadRooms(userId: string): Promise<string[]> {
  const key = `user:${userId}:unread_counts`;
  const rooms = await this.redis.hkeys(key);
  return rooms;
}

async removeCachedMessage(messageId: string): Promise<void> {
  const keyPattern = `chat:messages:*`;
  const keys = await this.redis.keys(keyPattern);

  for (const key of keys) {
    const messages = JSON.parse(await this.redis.get(key) || '[]');
    const filtered = messages.filter((msg) => msg.id !== messageId);
    await this.redis.set(key, JSON.stringify(filtered));
  }
}

async markMessageDeleted(messageId: string, roomId: string): Promise<void> {
  const key = `chat:messages:${roomId}`;
  const cached = JSON.parse(await this.redis.get(key) || '[]');
  const updated = cached.map((msg) =>
    msg.id === messageId ? { ...msg, deleted: true } : msg,
  );
  await this.redis.set(key, JSON.stringify(updated));
}




}





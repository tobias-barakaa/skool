import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@InjectRedis() private readonly redisInstance: Redis) {}

  // Expose Redis instance for advanced operations
  get redis(): Redis {
    return this.redisInstance;
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.redisInstance.get(key);
      if (!value) return null;

      // Handle different data types
      try {
        return JSON.parse(value);
      } catch (parseError) {
        // If JSON parsing fails, return as string
        this.logger.warn(
          `Failed to parse JSON for key ${key}, returning as string`,
        );
        return value as unknown as T;
      }
    } catch (error) {
      this.logger.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const serialized =
        typeof value === 'string' ? value : JSON.stringify(value);

      if (ttl && ttl > 0) {
        await this.redisInstance.setex(key, ttl, serialized);
      } else {
        await this.redisInstance.set(key, serialized);
      }
      return true;
    } catch (error) {
      this.logger.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string | string[]): Promise<boolean> {
    try {
      const keys = Array.isArray(key) ? key : [key];
      if (keys.length === 0) return true;

      await this.redisInstance.del(...keys);
      return true;
    } catch (error) {
      this.logger.error(`Redis DEL error for keys ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redisInstance.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.redisInstance.ttl(key);
    } catch (error) {
      this.logger.error(`Redis TTL error for key ${key}:`, error);
      return -1;
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redisInstance.keys(pattern);
      if (keys.length > 0) {
        await this.redisInstance.del(...keys);
        this.logger.debug(
          `Invalidated ${keys.length} keys matching pattern: ${pattern}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Redis pattern invalidation error for ${pattern}:`,
        error,
      );
    }
  }

  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (keys.length === 0) return [];

      const values = await this.redisInstance.mget(...keys);
      return values.map((value) => {
        if (!value) return null;
        try {
          return JSON.parse(value);
        } catch {
          return value as unknown as T;
        }
      });
    } catch (error) {
      this.logger.error(`Redis MGET error for keys ${keys.join(', ')}:`, error);
      return keys.map(() => null);
    }
  }

  async mset(
    keyValuePairs: Record<string, any>,
    ttl?: number,
  ): Promise<boolean> {
    try {
      const pipeline = this.redisInstance.pipeline();

      for (const [key, value] of Object.entries(keyValuePairs)) {
        const serialized =
          typeof value === 'string' ? value : JSON.stringify(value);

        if (ttl && ttl > 0) {
          pipeline.setex(key, ttl, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      this.logger.error('Redis MSET error:', error);
      return false;
    }
  }

  async incr(key: string, ttl?: number): Promise<number> {
    try {
      const pipeline = this.redisInstance.pipeline();
      pipeline.incr(key);

      if (ttl && ttl > 0) {
        pipeline.expire(key, ttl);
      }

      const results = await pipeline.exec();
      return (results?.[0]?.[1] as number) || 0;
    } catch (error) {
      this.logger.error(`Redis INCR error for key ${key}:`, error);
      return 0;
    }
  }

  async sadd(
    key: string,
    members: string | string[],
    ttl?: number,
  ): Promise<number> {
    try {
      const memberArray = Array.isArray(members) ? members : [members];
      const pipeline = this.redisInstance.pipeline();

      pipeline.sadd(key, ...memberArray);

      if (ttl && ttl > 0) {
        pipeline.expire(key, ttl);
      }

      const results = await pipeline.exec();
      return (results?.[0]?.[1] as number) || 0;
    } catch (error) {
      this.logger.error(`Redis SADD error for key ${key}:`, error);
      return 0;
    }
  }

  async smembers(key: string): Promise<string[]> {
    try {
      return await this.redisInstance.smembers(key);
    } catch (error) {
      this.logger.error(`Redis SMEMBERS error for key ${key}:`, error);
      return [];
    }
  }

  async sismember(key: string, member: string): Promise<boolean> {
    try {
      const result = await this.redisInstance.sismember(key, member);
      return result === 1;
    } catch (error) {
      this.logger.error(`Redis SISMEMBER error for key ${key}:`, error);
      return false;
    }
  }
}

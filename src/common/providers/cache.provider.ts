import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class CacheProvider {
  private readonly logger = new Logger(CacheProvider.name);
  private readonly DEFAULT_TTL = 3600; // 1 hour
  private readonly LOCK_RETRY_DELAY = 100; // 100ms
  private readonly LOCK_MAX_RETRIES = 5;

  constructor(private readonly redisService: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    return this.redisService.get<T>(key);
  }

  async set(
    key: string,
    value: any,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<boolean> {
    return this.redisService.set(key, value, ttl);
  }

  async invalidate(key: string): Promise<boolean> {
    return this.redisService.del(key);
  }

  async invalidateByPattern(pattern: string): Promise<void> {
    await this.redisService.invalidatePattern(pattern);
  }

  /**
   * Get multiple keys at once for batch operations
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    return this.redisService.mget<T>(keys);
  }

  /**
   * Set multiple keys at once for batch operations
   */
  async mset(
    keyValuePairs: Record<string, any>,
    ttl?: number,
  ): Promise<boolean> {
    return this.redisService.mset(keyValuePairs, ttl);
  }

  /**
   * Acquire a distributed lock using Redis SET NX EX
   */
  async acquireLock(
    lockKey: string,
    lockValue: string,
    ttlSeconds: number,
  ): Promise<boolean> {
    try {
      const result = await this.redisService.redis.set(
        lockKey,
        lockValue,
        'EX',
        ttlSeconds,
        'NX',
      );
      return result === 'OK';
    } catch (error) {
      this.logger.error(`Failed to acquire lock ${lockKey}:`, error);
      return false;
    }
  }

  /**
   * Release a distributed lock only if we own it
   */
  async releaseLock(lockKey: string, lockValue: string): Promise<boolean> {
    try {
      const luaScript = `
        if redis.call("GET", KEYS[1]) == ARGV[1] then
          return redis.call("DEL", KEYS[1])
        else
          return 0
        end
      `;

      const result = await this.redisService.redis.eval(
        luaScript,
        1,
        lockKey,
        lockValue,
      );
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to release lock ${lockKey}:`, error);
      return false;
    }
  }

  /**
   * Try to acquire lock with retries and exponential backoff
   */
  async acquireLockWithRetry(
    lockKey: string,
    lockValue: string,
    ttlSeconds: number,
    maxRetries: number = this.LOCK_MAX_RETRIES,
  ): Promise<boolean> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const acquired = await this.acquireLock(lockKey, lockValue, ttlSeconds);
      if (acquired) {
        return true;
      }

      if (attempt < maxRetries) {
        await this.sleep(this.LOCK_RETRY_DELAY * Math.pow(2, attempt)); // Exponential backoff
      }
    }

    return false;
  }

  /**
   * Comprehensive cache invalidation for configuration changes
   */
  async invalidateConfigCache(tenantId: string): Promise<void> {
    const patterns = [
      this.generateSchoolConfigKey(tenantId),
      this.generateCompleteConfigKey(tenantId),
      this.generateConfigResponseKey(tenantId),
      this.generateTenantValidationKey(tenantId),
      `levels:*`,
      `curriculum_subjects:*`,
      `grade_levels:*`,
      `streams:*`,
    ];

    const invalidationPromises = patterns.map(async (pattern) => {
      try {
        await this.invalidateByPattern(pattern);
        this.logger.debug(`Invalidated pattern: ${pattern}`);
      } catch (error) {
        this.logger.error(`Failed to invalidate pattern ${pattern}:`, error);
      }
    });

    await Promise.all(invalidationPromises);
    this.logger.log(`Invalidated all config caches for tenant: ${tenantId}`);
  }

  /**
   * Cache warming - preload frequently accessed data
   */
  async warmConfigCache(tenantId: string, configData: any): Promise<void> {
    const cacheOperations = {
      [this.generateCompleteConfigKey(tenantId)]: configData,
      [this.generateSchoolConfigKey(tenantId)]: configData,
    };

    try {
      await this.mset(cacheOperations, 3600);
      this.logger.debug(`Warmed config cache for tenant: ${tenantId}`);
    } catch (error) {
      this.logger.error(`Failed to warm cache for tenant ${tenantId}:`, error);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ==================== CACHE KEY GENERATORS ====================

  /**
   * Basic school configuration cache key
   */
  generateSchoolConfigKey(tenantId: string): string {
    return `school_config:tenant:${tenantId}`;
  }

  /**
   * Complete configuration with all relations cache key
   */
  generateCompleteConfigKey(tenantId: string): string {
    return `school_config:complete:tenant:${tenantId}`;
  }

  /**
   * Processed configuration response cache key
   */
  generateConfigResponseKey(tenantId: string): string {
    return `school_config:response:tenant:${tenantId}`;
  }

  /**
   * Tenant validation cache key
   */
  generateTenantValidationKey(tenantId: string): string {
    return `tenant:validation:${tenantId}`;
  }

  /**
   * Configuration lock key
   */
  generateConfigLockKey(tenantId: string): string {
    return `school_config_lock:${tenantId}`;
  }

  /**
   * Levels validation cache key
   */
  generateLevelsKey(levelNames: string[]): string {
    const sortedNames = [...levelNames].sort().join(',');
    return `levels:${Buffer.from(sortedNames).toString('base64')}`;
  }

  /**
   * Curriculum subjects cache key
   */
  generateCurriculumSubjectsKey(
    gradeLevelIds: number[],
    schoolTypeId: number,
  ): string {
    const sortedIds = [...gradeLevelIds].sort().join(',');
    return `curriculum_subjects:grades:${sortedIds}:school_type:${schoolTypeId}`;
  }

  /**
   * Grade levels cache key
   */
  generateGradeLevelsKey(curriculumId: number): string {
    return `grade_levels:curriculum:${curriculumId}`;
  }

  /**
   * Streams cache key
   */
  generateStreamsKey(gradeLevelId: number): string {
    return `streams:grade_level:${gradeLevelId}`;
  }

  /**
   * School type validation cache key
   */
  generateSchoolTypeKey(schoolTypeId: number): string {
    return `school_type:${schoolTypeId}`;
  }

  /**
   * User session cache key
   */
  generateUserSessionKey(userId: string): string {
    return `user_session:${userId}`;
  }

  /**
   * Rate limiting cache key
   */
  generateRateLimitKey(identifier: string, action: string): string {
    return `rate_limit:${action}:${identifier}`;
  }
}
// import { Injectable, Logger } from '@nestjs/common';
// import { RedisService } from 'src/redis/redis.service';

// @Injectable()
// export class CacheProvider {
//   private readonly logger = new Logger(CacheProvider.name);
//   private readonly DEFAULT_TTL = 3600; // 1 hour

//   constructor(private readonly redisService: RedisService) {}

//   async get<T>(key: string): Promise<T | null> {
//     return this.redisService.get<T>(key);
//   }

//   async set(
//     key: string,
//     value: any,
//     ttl: number = this.DEFAULT_TTL,
//   ): Promise<boolean> {
//     return this.redisService.set(key, value, ttl);
//   }

//   async invalidate(key: string): Promise<boolean> {
//     return this.redisService.del(key);
//   }

//   async invalidateByPattern(pattern: string): Promise<void> {
//     await this.redisService.invalidatePattern(pattern);
//   }

//   // Generate cache keys
//   generateSchoolConfigKey(tenantId: string): string {
//     return `school_config:tenant:${tenantId}`;
//   }

//   generateLevelsKey(levelNames: string[]): string {
//     const sortedNames = [...levelNames].sort().join(',');
//     return `levels:${Buffer.from(sortedNames).toString('base64')}`;
//   }

//   generateCurriculumSubjectsKey(
//     gradeLevelIds: number[],
//     schoolTypeId: number,
//   ): string {
//     const sortedIds = [...gradeLevelIds].sort().join(',');
//     return `curriculum_subjects:grades:${sortedIds}:school_type:${schoolTypeId}`;
//   }
// }

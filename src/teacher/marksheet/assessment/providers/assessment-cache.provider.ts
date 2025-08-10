import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class AssessmentCacheProvider {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  private getAssessmentKey(
    tenantId: string,
    subjectId: string,
    gradeLevelId: string,
    term: string,
  ): string {
    return `assessment:${tenantId}:${subjectId}:${gradeLevelId}:${term}`;
  }

  private getCACountKey(
    tenantId: string,
    subjectId: string,
    gradeLevelId: string,
    term: string,
  ): string {
    return `ca_count:${tenantId}:${subjectId}:${gradeLevelId}:${term}`;
  }

  private getExamLockKey(
    tenantId: string,
    subjectId: string,
    gradeLevelId: string,
    term: string,
  ): string {
    return `exam_lock:${tenantId}:${subjectId}:${gradeLevelId}:${term}`;
  }

  async getNextCANumber(
    tenantId: string,
    subjectId: string,
    gradeLevelId: string,
    term: string,
  ): Promise<number> {
    const key = this.getCACountKey(tenantId, subjectId, gradeLevelId, term);
    const count = await this.redis.incr(key);

    await this.redis.expire(key, 86400);

    return count;
  }

  async acquireExamLock(
    tenantId: string,
    subjectId: string,
    gradeLevelId: string,
    term: string,
  ): Promise<boolean> {
    const key = this.getExamLockKey(tenantId, subjectId, gradeLevelId, term);
    const result = await this.redis.set(key, '1', 'EX', 300, 'NX'); 
    return result === 'OK';
  }

  async releaseExamLock(
    tenantId: string,
    subjectId: string,
    gradeLevelId: string,
    term: string,
  ): Promise<void> {
    const key = this.getExamLockKey(tenantId, subjectId, gradeLevelId, term);
    await this.redis.del(key);
  }

  async cacheAssessment(assessment: any): Promise<void> {
    const key = this.getAssessmentKey(
      assessment.tenantId,
      assessment.subjectId,
      assessment.gradeLevelId,
      assessment.term,
    );

    await this.redis.hset(key, {
      [`${assessment.type}:${assessment.id}`]: JSON.stringify(assessment),
    });

    // Set expiration to 1 hour
    await this.redis.expire(key, 3600);
  }

  async getCachedAssessments(
    tenantId: string,
    subjectId: string,
    gradeLevelId: string,
    term: string,
  ): Promise<any[]> {
    const key = this.getAssessmentKey(tenantId, subjectId, gradeLevelId, term);
    const cached = await this.redis.hgetall(key);

    return Object.values(cached).map((item) => JSON.parse(item));
  }

  async invalidateAssessmentCache(
    tenantId: string,
    subjectId: string,
    gradeLevelId: string,
    term: string,
  ): Promise<void> {
    const keys = [
      this.getAssessmentKey(tenantId, subjectId, gradeLevelId, term),
      this.getCACountKey(tenantId, subjectId, gradeLevelId, term),
      this.getExamLockKey(tenantId, subjectId, gradeLevelId, term),
    ];

    await this.redis.del(...keys);
  }
}

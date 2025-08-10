import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheProvider } from '../providers/cache.provider';
import { CACHE_KEY } from '../decorators/cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private cacheProvider: CacheProvider,
    private reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const ttl = this.reflector.get<number>(CACHE_KEY, context.getHandler());

    if (!ttl) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const cacheKey = this.generateCacheKey(request);

    const cachedResult = await this.cacheProvider.get(cacheKey);
    if (cachedResult) {
      return of(cachedResult);
    }

    return next.handle().pipe(
      tap(async (result) => {
        await this.cacheProvider.set(cacheKey, result, ttl);
      }),
    );
  }

  private generateCacheKey(request: any): string {
    const { method, url, body, user } = request;
    return `${method}:${url}:${JSON.stringify(body)}:${user?.sub || 'anonymous'}`;
  }
}

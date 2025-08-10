import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY = 'cache';
export const Cache = (ttl: number = 3600) => SetMetadata(CACHE_KEY, ttl);

// src/common/interceptors/cache.interceptor.ts

import { Global, Module } from '@nestjs/common';
import { CacheProvider } from './providers/cache.provider';
import { RedisModule } from 'src/redis/redis.module';

@Global()
@Module({
  providers: [CacheProvider],
  imports: [RedisModule],
  exports: [CacheProvider],
})
export class CommonModule {}

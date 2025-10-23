import { Global, Module } from '@nestjs/common';
import { RedisModule as IoRedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    IoRedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: configService.get<string>('redis.url') || 'redis://localhost:6379',
      }),
    }),
  ],
  providers: [RedisService],
  exports: [IoRedisModule, RedisService],
})
export class RedisModule {}


// Odesk and Elance

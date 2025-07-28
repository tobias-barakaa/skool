import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatProvider } from './providers/chat.provider';
import { RedisChatProvider } from './providers/redis-chat.provider';
import { ChatGateway } from './gateways/chat.gateway';
import { SocketTestService } from './test/socket-test.service';
import { SocketTestResolver } from './test/socket-test.resolver';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ChatService } from './providers/chat.service';
import { ChatResolver } from './chat.resolver';
import { StudentModule } from 'src/admin/student/student.module';
import { ParentModule } from 'src/admin/parent/parent.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoom, ChatMessage]),
    RedisModule.forRoot({
      type: 'single',
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    }),
    StudentModule,
    ParentModule,
  ],
  providers: [
    ChatProvider,
    RedisChatProvider,
    ChatService,
    ChatResolver,
    ChatGateway,
    SocketTestService,
    SocketTestResolver,
  ],
  exports: [ChatService],
})
export class MessagingModule {}

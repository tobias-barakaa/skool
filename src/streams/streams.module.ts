import { Module } from '@nestjs/common';
import { StreamsService } from './providers/stream.service';
import { CreateStreamProvider } from './providers/stream.create.provider';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stream } from './entities/streams.entity';
import { StreamsResolver } from './streams.resolver';
import { LevelModule } from 'src/level/level.module';

@Module({
  imports: [TypeOrmModule.forFeature([Stream]), LevelModule],
  exports: [StreamsService],
  providers: [StreamsService, CreateStreamProvider, StreamsResolver]
})
export class StreamsModule {}

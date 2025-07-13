import { Module } from '@nestjs/common';
import { StreamsService } from './providers/stream.service';
import { CreateStreamProvider } from './providers/stream.create.provider';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stream } from './entities/streams.entity';
import { StreamsResolver } from './streams.resolver';
import { DeleteStreamProvider } from './providers/delete-stream.provider';
import { UpdateStreamProvider } from './providers/update-stream.provider';
import { LevelModule } from '../level/level.module';

@Module({
  imports: [TypeOrmModule.forFeature([Stream]), LevelModule],
  exports: [StreamsService, TypeOrmModule],
  providers: [StreamsService, CreateStreamProvider,DeleteStreamProvider,UpdateStreamProvider, StreamsResolver]
})
export class StreamsModule {}

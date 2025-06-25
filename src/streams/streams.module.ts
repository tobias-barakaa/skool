import { Module } from '@nestjs/common';
import { StreamsService } from './providers/stream.service';
import { CreateStreamProvider } from './providers/stream.create.provider';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stream } from './entities/streams.entity';
import { StreamsResolver } from './streams.resolver';
import { LevelModule } from 'src/level/level.module';
import { DeleteStreamProvider } from './providers/delete-stream.provider';
import { UpdateStreamProvider } from './providers/update-stream.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Stream]), LevelModule],
  exports: [StreamsService],
  providers: [StreamsService, CreateStreamProvider,DeleteStreamProvider,UpdateStreamProvider, StreamsResolver]
})
export class StreamsModule {}

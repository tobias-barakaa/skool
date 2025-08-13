import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LevelModule } from '../level/level.module';
import { Stream } from './entities/streams.entity';
import { DeleteStreamProvider } from './providers/delete-stream.provider';
import { StreamsService } from './providers/services/stream.service';
import { CreateStreamProvider } from './providers/stream.create.provider';
import { UpdateStreamProvider } from './providers/update-stream.provider';
import { StreamsResolver } from './streams.resolver';
import { CreateTenantStreamProvider } from './providers/create-tenant-stream.provider';
import { CreateTenantStreamService } from './providers/services/create-tenant-stream.service';
import { TenantStreamResolver } from './resolvers/tenant-stream.resolver';
import { SchoolTypeModule } from '../school-type/school-type.module';

@Module({
  imports: [TypeOrmModule.forFeature([Stream]), LevelModule, SchoolTypeModule],
  exports: [
    StreamsService,
    TypeOrmModule,

    CreateTenantStreamProvider,
    CreateTenantStreamService,
  ],
  providers: [
    StreamsService,
    CreateStreamProvider,
    DeleteStreamProvider,
    UpdateStreamProvider,
    StreamsResolver,
    CreateTenantStreamProvider,
    CreateTenantStreamService,
    TenantStreamResolver,

  ],
})
export class StreamsModule {}


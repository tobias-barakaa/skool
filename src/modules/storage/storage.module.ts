// 8. src/modules/storage/storage.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BackblazeService } from './services/backblaze.service';
import { StorageController } from './controllers/storage.controller';
import backblazeConfig from '../../config/backblaze.config';

@Module({
  imports: [ConfigModule.forFeature(backblazeConfig)],
  controllers: [StorageController],
  providers: [BackblazeService],
  exports: [BackblazeService],
})
export class StorageModule {}

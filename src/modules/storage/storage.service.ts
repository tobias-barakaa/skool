// src/services/storage.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { BackblazeService } from './services/backblaze.service';
import { LocalStorageService } from './local-storage.service';

interface FileUploadDto {
  tenantId?: string;
  entityType: string;
  entityId: string;
  userId?: string;
}

interface FileUploadResult {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  path: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  userId?: string;
  uploadedAt: Date;
  storage: 'backblaze' | 'local'; // Track which storage was used
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private backblazeHealthy = true;
  private lastHealthCheck = 0;
  private readonly healthCheckInterval = 60000; // 1 minute

  constructor(
    private readonly backblazeService: BackblazeService,
    private readonly localStorageService: LocalStorageService,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    dto: FileUploadDto,
  ): Promise<FileUploadResult> {
    // Check Backblaze health periodically
    await this.checkBackblazeHealth();

    if (this.backblazeHealthy) {
      try {
        this.logger.log('Attempting upload to Backblaze...');
        const result = await this.backblazeService.uploadFile(file, dto);
        return { ...result, storage: 'backblaze' };
      } catch (error) {
        this.logger.error(
          'Backblaze upload failed, falling back to local storage',
          error,
        );
        this.backblazeHealthy = false;
        this.lastHealthCheck = Date.now();

        // Fall back to local storage
        const result = await this.localStorageService.uploadFile(file, dto);
        return { ...result, storage: 'local' };
      }
    } else {
      this.logger.log('Backblaze unhealthy, using local storage');
      const result = await this.localStorageService.uploadFile(file, dto);
      return { ...result, storage: 'local' };
    }
  }

  private async checkBackblazeHealth(): Promise<void> {
    const now = Date.now();

    // Only check health every minute
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return;
    }

    try {
      const bestEndpoint = await this.backblazeService.getBestEndpoint();
      this.backblazeHealthy = bestEndpoint !== null;
      this.lastHealthCheck = now;

      if (this.backblazeHealthy) {
        this.logger.log(`Backblaze is healthy (endpoint: ${bestEndpoint})`);
      } else {
        this.logger.warn('All Backblaze endpoints are unhealthy');
      }
    } catch (error) {
      this.logger.error('Health check failed', error);
      this.backblazeHealthy = false;
      this.lastHealthCheck = now;
    }
  }

  async getStorageStats(): Promise<{
    backblaze: { healthy: boolean; endpoints: any[] };
    local: { available: boolean; freeSpace?: number };
  }> {
    const backblazeEndpoints = await this.backblazeService.testConnection();
    const backblazeHealthy = backblazeEndpoints.some((e) => e.status);

    return {
      backblaze: {
        healthy: backblazeHealthy,
        endpoints: backblazeEndpoints,
      },
      local: {
        available: await this.localStorageService.isAvailable(),
        freeSpace: await this.localStorageService.getFreeSpace(),
      },
    };
  }
}

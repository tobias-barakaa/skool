import { Injectable, Logger } from '@nestjs/common';
import { TenantStream } from 'src/admin/school-type/entities/tenant-stream';
import { CreateTenantStreamDto, CreateTenantStreamProvider } from '../create-tenant-stream.provider';


@Injectable()
export class CreateTenantStreamService {
  private readonly logger = new Logger(CreateTenantStreamService.name);

  constructor(
    private readonly createTenantStreamProvider: CreateTenantStreamProvider,
  ) {}

  async createTenantStream(dto: CreateTenantStreamDto): Promise<TenantStream> {
    this.logger.log(`Creating tenant stream for tenant: ${dto.tenantId}`);
    return await this.createTenantStreamProvider.createTenantStream(dto);
  }

  async deleteTenantStream(
    tenantStreamId: string,
    tenantId: string,
  ): Promise<boolean> {
    this.logger.log(
      `Deleting tenant stream: ${tenantStreamId} for tenant: ${tenantId}`,
    );
    return await this.createTenantStreamProvider.deleteTenantStream(
      tenantStreamId,
      tenantId,
    );
  }

  async getTenantStreams(
    tenantId: string,
    tenantGradeLevelId?: string,
  ): Promise<TenantStream[]> {
    this.logger.log(`Getting tenant streams for tenant: ${tenantId}`);
    return await this.createTenantStreamProvider.getTenantStreams(
      tenantId,
      tenantGradeLevelId,
    );
  }
}

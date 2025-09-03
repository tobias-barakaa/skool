import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import { 
  S3Client, 
  PutObjectCommand, 
  HeadBucketCommand, 
  DeleteObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';
import backblazeConfig from 'src/config/backblaze.config';

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
}

@Injectable()
export class BackblazeService {
  private readonly s3Clients: S3Client[];
  private readonly bucketName: string;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;
  private readonly endpoints = [
    'https://s3.us-east-005.backblazeb2.com',
    'https://s3.us-east-005.backblazeb2.com',
    'https://s3.us-east-005.backblazeb2.com',
  ];

  constructor(
    private readonly configService: ConfigService,
    @Inject(backblazeConfig.KEY)
    private readonly config: ConfigType<typeof backblazeConfig>,
  ) {
    this.bucketName =
      this.config.bucketName ??
      (() => {
        throw new Error('Bucket name is not defined in the configuration');
      })();

    this.s3Clients = this.endpoints.map(
      (endpoint) =>
        new S3Client({
          endpoint,
          region: this.config.region,
          credentials: {
            accessKeyId:
              this.config.keyId ??
              (() => {
                throw new Error('Key ID is not defined in the configuration');
              })(),
            secretAccessKey:
              this.config.applicationKey ??
              (() => {
                throw new Error(
                  'Application key is not defined in the configuration',
                );
              })(),
          },
          forcePathStyle: true,
          requestHandler: {
            requestTimeout: 15000,
            connectionTimeout: 5000,
          },
          maxAttempts: 1, // We handle retries manually
        }),
    );
  }

  async uploadFile(
    file: Express.Multer.File,
    dto: FileUploadDto,
  ): Promise<FileUploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    console.log(
      `Uploading file: ${file.originalname} (${file.size} bytes)`,
    );

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
    }

    const fileName = this.generateUniqueFileName(file.originalname);
    const filePath = this.generateFilePath(dto, fileName);

    return this.uploadWithRetry(file, dto, fileName, filePath);
  }

  private async uploadWithRetry(
    file: Express.Multer.File,
    dto: FileUploadDto,
    fileName: string,
    filePath: string,
    attempt = 1,
  ): Promise<FileUploadResult> {
    const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
    if (file.size > MAX_BYTES) {
      throw new BadRequestException(
        `File too large. Maximum allowed size is 10 MB.`,
      );
    }

    for (
      let endpointIndex = 0;
      endpointIndex < this.s3Clients.length;
      endpointIndex++
    ) {
      const s3Client = this.s3Clients[endpointIndex];
      const endpoint = this.endpoints[endpointIndex];

      try {
        console.log(
          `Upload attempt ${attempt}/${this.maxRetries + 1} for file: ${fileName} using endpoint: ${endpoint}`,
        );

        const upload = new Upload({
          client: s3Client,
          params: {
            Bucket: this.bucketName,
            Key: filePath,
            Body: file.buffer,
            ContentType: file.mimetype,
            Metadata: {
              tenantId: dto.tenantId || '',
              entityType: dto.entityType,
              entityId: dto.entityId,
              userId: dto.userId || '',
              originalName: file.originalname,
              uploadedAt: new Date().toISOString(),
            },
          },
        });

        upload.on('httpUploadProgress', (progress: any) => {
          console.log(`Upload progress: ${JSON.stringify(progress)}`);
        });

        const abortController = new AbortController();
        const timeoutId = setTimeout(() => {
          abortController.abort();
        }, 15000);

        upload.on('httpUploadProgress', () => {
          clearTimeout(timeoutId);
        });

        const result = await upload.done();
        clearTimeout(timeoutId);

        console.log(
          `Successfully uploaded file: ${fileName} to ${result.Location} via ${endpoint}`,
        );

        return {
          id: uuidv4(),
          fileName,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: result.Location || `${endpoint}/${this.bucketName}/${filePath}`,
          path: filePath,
          tenantId: dto.tenantId || '',
          entityType: dto.entityType,
          entityId: dto.entityId,
          userId: dto.userId,
          uploadedAt: new Date(),
        };
      } catch (err) {
        console.error(
          `S3 Upload Error (attempt ${attempt}, endpoint ${endpoint}):`,
          {
            error: err.message || 'Unknown error',
            name: err.name,
            code: err.code,
            statusCode: err.$metadata?.httpStatusCode,
            retryable: err.$retryable,
          },
        );

        if (
          endpointIndex === this.s3Clients.length - 1 &&
          attempt <= this.maxRetries
        ) {
          const delay = this.calculateRetryDelay(attempt);
          console.log(
            `All endpoints failed for attempt ${attempt}. Retrying in ${delay}ms...`,
          );
          await this.sleep(delay);
          return this.uploadWithRetry(
            file,
            dto,
            fileName,
            filePath,
            attempt + 1,
          );
        }

        if (endpointIndex < this.s3Clients.length - 1) {
          console.log(`Trying next endpoint...`);
          continue;
        }
      }
    }

    throw new InternalServerErrorException(
      `Failed to upload after ${attempt} attempts across all endpoints`,
    );
  }

  private calculateRetryDelay(attempt: number): number {
    const baseDelay = this.retryDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000;
    return Math.min(baseDelay + jitter, 10000);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateFilePath(dto: FileUploadDto, fileName: string): string {
    return `tenants/${dto.tenantId}/${dto.entityType}/${dto.entityId}/files/${fileName}`;
  }

  private generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const uuid = uuidv4().slice(0, 8);
    const dotIndex = originalName.lastIndexOf('.');
    const name =
      dotIndex !== -1 ? originalName.substring(0, dotIndex) : originalName;
    const ext = dotIndex !== -1 ? originalName.substring(dotIndex + 1) : 'bin';
    return `${timestamp}-${uuid}-${name}.${ext}`;
  }

  async testConnection(): Promise<
    { endpoint: string; status: boolean; error?: string }[]
  > {
    const results: { endpoint: string; status: boolean; error?: string }[] = [];

    for (let i = 0; i < this.s3Clients.length; i++) {
      const s3Client = this.s3Clients[i];
      const endpoint = this.endpoints[i];

      try {
        const command = new HeadBucketCommand({ Bucket: this.bucketName });
        
        await Promise.race([
          s3Client.send(command),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 5000),
          ),
        ]);
        
        results.push({ endpoint, status: true });
      } catch (error) {
        results.push({ 
          endpoint, 
          status: false, 
          error: error.message || error.name 
        });
      }
    }

    return results;
  }

  async getBestEndpoint(): Promise<string | null> {
    const results = await this.testConnection();
    const healthy = results.find((r) => r.status);
    return healthy?.endpoint || null;
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    dto: FileUploadDto,
  ): Promise<FileUploadResult[]> {
    const concurrencyLimit = 3;
    const results: FileUploadResult[] = [];
    
    for (let i = 0; i < files.length; i += concurrencyLimit) {
      const batch = files.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.all(
        batch.map((file) => this.uploadFile(file, dto))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  async deleteFile(filePath: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: filePath,
    });

    try {
      await this.s3Clients[0].send(command);
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to delete file: ${err.message}`,
      );
    }
  }

  async getSignedUrl(filePath: string, expiresIn = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: filePath,
      });

      return await getSignedUrl(this.s3Clients[0], command, {
        expiresIn,
      });
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to create signed URL: ${err.message}`,
      );
    }
  }

  async listEntityFiles(
    tenantId: string,
    entityType: string,
    entityId: string,
  ): Promise<any[]> {
    try {
      const prefix = `tenants/${tenantId}/${entityType}/${entityId}/files/`;
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      });

      const result = await this.s3Clients[0].send(command);
      return result.Contents || [];
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to list files: ${err.message}`,
      );
    }
  }
}
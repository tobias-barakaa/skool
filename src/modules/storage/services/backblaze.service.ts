import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { ConfigService, ConfigType } from '@nestjs/config';
import { S3 } from 'aws-sdk';
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
  private readonly s3Clients: S3[];
  private readonly bucketName: string;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second base delay
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

    // Create multiple S3 clients for different endpoints
    this.s3Clients = this.endpoints.map(
      (endpoint) =>
        new S3({
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
          s3ForcePathStyle: true,
          // More aggressive timeout settings
          httpOptions: {
            timeout: 15000, // Reduced to 15 seconds
            connectTimeout: 5000, // Reduced to 5 seconds
            agent: undefined, // Disable connection pooling to avoid stale connections
          },
          maxRetries: 0, // Disable SDK retries, we'll handle them ourselves
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
      `Uploading file: ${file.originalname} (${file.size} bytes)gggggggggggggggggggg`,
    );
    console.log(dto, 'this is the dtoooss//////////////////////');
    console.log(file, 'this is the file.....................:');

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
    // Try different endpoints in sequence
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

        const uploadParams = {
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
        };

        // Use Promise.race to implement our own timeout
        const uploadPromise = s3Client.upload(uploadParams).promise();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Upload timeout')), 15000);
        });

        const result = (await Promise.race([
          uploadPromise,
          timeoutPromise,
        ])) as any;

        console.log(
          `Successfully uploaded file: ${fileName} to ${result.Location} via ${endpoint}`,
        );

        return {
          id: uuidv4(),
          fileName,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: result.Location,
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
            code: err.code,
            statusCode: err.statusCode,
            retryable: err.retryable,
          },
        );

        // If this is the last endpoint and we still have retries left, try again
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

        // If not the last endpoint, continue to next endpoint
        if (endpointIndex < this.s3Clients.length - 1) {
          console.log(`Trying next endpoint...`);
          continue;
        }
      }
    }

    // If we've exhausted all endpoints and retries
    throw new InternalServerErrorException(
      `Failed to upload after ${attempt} attempts across all endpoints`,
    );
  }

  private isRetryableError(error: any): boolean {
    // Network-related errors that are typically retryable
    const retryableCodes = [
      'ETIMEDOUT',
      'ECONNRESET',
      'ENOTFOUND',
      'ENETUNREACH',
      'EHOSTUNREACH',
      'EPIPE',
      'TimeoutError',
    ];

    // HTTP status codes that are retryable
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];

    return (
      retryableCodes.includes(error.code) ||
      retryableStatusCodes.includes(error.statusCode) ||
      error.retryable === true
    );
  }

  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = this.retryDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    return Math.min(baseDelay + jitter, 10000); // Cap at 10 seconds
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

  // Health check method to test connectivity across all endpoints
  async testConnection(): Promise<
    { endpoint: string; status: boolean; error?: string }[]
  > {
    const results: { endpoint: string; status: boolean; error?: string }[] = [];

    for (let i = 0; i < this.s3Clients.length; i++) {
      const s3Client = this.s3Clients[i];
      const endpoint = this.endpoints[i];

      try {
        await Promise.race([
          s3Client.headBucket({ Bucket: this.bucketName }).promise(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 5000),
          ),
        ]);
        results.push({ endpoint, status: true });
      } catch (error) {
        results.push({ endpoint, status: false, error: error.message });
      }
    }

    return results;
  }

  // Get the best available endpoint
  async getBestEndpoint(): Promise<string | null> {
    const results = await this.testConnection();
    const healthy = results.find((r) => r.status);
    return healthy?.endpoint || null;
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    dto: FileUploadDto,
  ): Promise<FileUploadResult[]> {
    return Promise.all(files.map((file) => this.uploadFile(file, dto)));
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const s3Client = this.s3Clients[0]; // Use the first S3 client as default
      await s3Client
        .deleteObject({
          Bucket: this.bucketName,
          Key: filePath,
        })
        .promise();
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to delete file: ${err.message}`,
      );
    }
  }

  async getSignedUrl(filePath: string, expiresIn = 3600): Promise<string> {
    try {
      return this.s3Clients[0].getSignedUrl('getObject', {
        Bucket: this.bucketName,
        Key: filePath,
        Expires: expiresIn,
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

      const result = await this.s3Clients[0]
        .listObjectsV2({
          Bucket: this.bucketName,
          Prefix: prefix,
        })
        .promise();

      return result.Contents || [];
    } catch (err) {
      throw new InternalServerErrorException(
        `Failed to list files: ${err.message}`,
      );
    }
  }
}

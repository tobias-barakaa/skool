// src/services/local-storage.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

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
export class LocalStorageService {
  private readonly uploadDir = process.env.LOCAL_UPLOAD_DIR || './uploads';
  private readonly baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  async uploadFile(
    file: Express.Multer.File,
    dto: FileUploadDto,
  ): Promise<FileUploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

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
    const fullPath = path.join(this.uploadDir, filePath);

    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // Write file
    await fs.writeFile(fullPath, file.buffer);

    const url = `${this.baseUrl}/api/files/${filePath}`;

    return {
      id: uuidv4(),
      fileName,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url,
      path: filePath,
      tenantId: dto.tenantId || '',
      entityType: dto.entityType,
      entityId: dto.entityId,
      userId: dto.userId,
      uploadedAt: new Date(),
    };
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

  async isAvailable(): Promise<boolean> {
    try {
      await fs.access(this.uploadDir);
      return true;
    } catch {
      try {
        await fs.mkdir(this.uploadDir, { recursive: true });
        return true;
      } catch {
        return false;
      }
    }
  }

  async getFreeSpace(): Promise<number> {
    try {
      const stats = await fs.statfs(this.uploadDir);
      return stats.bfree * stats.bsize;
    } catch {
      return 0;
    }
  }
}

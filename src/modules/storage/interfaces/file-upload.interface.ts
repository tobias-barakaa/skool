export interface FileUploadResult {
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

export interface BackblazeConfig {
  keyId: string;
  applicationKey: string;
  bucketName: string;
  region: string;
  endpoint: string;
}

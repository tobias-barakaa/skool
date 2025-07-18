import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class FileUploadDto {
  @IsString()
  @IsOptional() 
  tenantId?: string;

  @IsString()
  @IsNotEmpty()
  entityType: 'assignment' | 'question' | 'submission';

  @IsString()
  @IsNotEmpty()
  entityId: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

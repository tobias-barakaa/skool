import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Query,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { BackblazeService } from '../services/backblaze.service';
import { FileUploadResult } from '../interfaces/file-upload.interface';
import { FileUploadDto } from '../dto/upload.dto';
import { Request } from 'express';
import { ActiveUserData } from 'src/admin/auth/interface/active-user.interface';


@Controller('api/storage')
export class StorageController {
  constructor(private readonly backblazeService: BackblazeService) {}

  @Post('upload/single')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingleFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 10 * 1024 * 1024, 
            message: 'File too large. Maximum allowed size is 10 MB.',
          }),
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|gif|webp|pdf|doc|docx|txt)$/i,
          }),
        ],
      }),
    )
    file: Express.Multer.File,

    @Body() uploadDto: FileUploadDto,
    @Req() req: Request, 
  ): Promise<FileUploadResult> {
    const user = req.user as ActiveUserData;

    uploadDto.userId = uploadDto.userId || user.sub;
    uploadDto.tenantId = uploadDto.tenantId || user.tenantId;

    if (!uploadDto.entityType || !uploadDto.entityId) {
      throw new BadRequestException('Missing entityType or entityId');
    }

    return this.backblazeService.uploadFile(file, uploadDto);
  }

 
  @Post('upload/multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultipleFiles(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|gif|webp|pdf|doc|docx|txt)$/i,
          }),
        ],
      }),
    )
    files: Express.Multer.File[],
    @Body() uploadDto: FileUploadDto,
  ): Promise<FileUploadResult[]> {
    return this.backblazeService.uploadMultipleFiles(files, uploadDto);
  }

  @Get('file/:tenantId/:entityType/:entityId/signed-url')
  async getSignedUrl(
    @Param('tenantId') tenantId: string,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query('fileName') fileName: string,
    @Query('expiresIn') expiresIn?: number,
  ): Promise<{ url: string }> {
    const filePath = `tenants/${tenantId}/${entityType}/${entityId}/files/${fileName}`;
    const url = await this.backblazeService.getSignedUrl(filePath, expiresIn);
    return { url };
  }

 
  @Get('files/:tenantId/:entityType/:entityId')
  async listEntityFiles(
    @Param('tenantId') tenantId: string,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ): Promise<any[]> {
    return this.backblazeService.listEntityFiles(
      tenantId,
      entityType,
      entityId,
    );
  }

 
  @Delete('file/:tenantId/:entityType/:entityId/:fileName')
  async deleteFile(
    @Param('tenantId') tenantId: string,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Param('fileName') fileName: string,
  ): Promise<{ message: string }> {
    const filePath = `tenants/${tenantId}/${entityType}/${entityId}/files/${fileName}`;
    await this.backblazeService.deleteFile(filePath);
    return { message: 'File deleted successfully' };
  }
}

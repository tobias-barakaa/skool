// src/common/exceptions/business.exception.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(
    public readonly message: string,
    public readonly code: string = 'BUSINESS_ERROR',
    public readonly metadata: Record<string, any> = {},
  ) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

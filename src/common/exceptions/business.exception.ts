// src/common/exceptions/business.exception.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export abstract class BusinessException extends HttpException {
  public readonly code: string;
  public readonly metadata?: Record<string, any>;

  constructor(
    message: string, 
    code: string, 
    statusCode: HttpStatus,
    metadata?: Record<string, any>
  ) {
    super(message, statusCode);
    this.code = code;
    this.metadata = metadata;
  }
}

export class SchoolAlreadyExistsException extends BusinessException {
  constructor(subdomain: string) {
    super(
      `School with subdomain ${subdomain} already exists`,
      'SCHOOL_ALREADY_EXISTS',
      HttpStatus.CONFLICT,
      { subdomain } // Additional metadata
    );
  }
}

export class UserAlreadyExistsException extends BusinessException {
  constructor(email: string) {
    super(
      `User with email ${email} already exists`,
      'USER_ALREADY_EXISTS',
      HttpStatus.CONFLICT,
      { email } // Additional metadata
    );
  }
}
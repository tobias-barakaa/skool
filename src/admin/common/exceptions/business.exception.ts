import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  public readonly code: string;
  public readonly metadata?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    metadata?: Record<string, any>
  ) {
    super(message, statusCode);
    this.code = code;
    this.metadata = metadata;
    this.name = 'BusinessException';
  }
}

export class UserAlreadyExistsException extends BusinessException {
  constructor(email: string) {
    super(
      `User with email ${email} already exists`,
      'USER_ALREADY_EXISTS',
      HttpStatus.CONFLICT,
      { email }
    );
    this.name = 'UserAlreadyExistsException';
  }
}

export class SchoolAlreadyExistsException extends BusinessException {
  constructor(subdomain: string) {
    super(
      `School with subdomain ${subdomain} already exists`,
      'SCHOOL_ALREADY_EXISTS',
      HttpStatus.CONFLICT,
      { subdomain }
    );
    this.name = 'SchoolAlreadyExistsException';
  }
}


export class UserNotInTenantException extends BusinessException {
  constructor(userId: string, tenantId: string) {
    super(
      `User ${userId} does not belong to tenant ${tenantId}`,
      'USER_NOT_IN_TENANT',
      HttpStatus.UNAUTHORIZED,
      { userId, tenantId }
    );
    this.name = 'UserNotInTenantException';
  }
}

// email-send-failed.exception.ts

export class EmailSendFailedException extends BusinessException {
  constructor(email: string) {
    super(
      `cannot send invitation in development mode: ${email}`,
      'EMAIL_SEND_FAILED',
      HttpStatus.INTERNAL_SERVER_ERROR,
      { email }
    );
    this.name = 'EmailSendFailedException';
  }
}

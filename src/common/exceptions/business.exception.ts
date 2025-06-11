import { HttpStatus } from '@nestjs/common';

export abstract class BusinessException extends Error {
  abstract readonly statusCode: HttpStatus;
  abstract readonly errorCode: string;
  
  constructor(
    message: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UserAlreadyExistsException extends BusinessException {
  readonly statusCode = HttpStatus.CONFLICT;
  readonly errorCode = 'USER_ALREADY_EXISTS';

  constructor(email: string) {
    super(`User with email ${email} already exists`, { email });
  }
}

export class SchoolAlreadyExistsException extends BusinessException {
  readonly statusCode = HttpStatus.CONFLICT;
  readonly errorCode = 'SCHOOL_ALREADY_EXISTS';

  constructor(subdomain: string) {
    super(`School with subdomain ${subdomain} already exists`, { subdomain });
  }
}

export class ValidationException extends BusinessException {
  readonly statusCode = HttpStatus.BAD_REQUEST;
  readonly errorCode = 'VALIDATION_ERROR';

  constructor(message: string, validationErrors?: Record<string, any>) {
    super(message, { validationErrors });
  }
}

export class DatabaseException extends BusinessException {
  readonly statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
  readonly errorCode = 'DATABASE_ERROR';

  constructor(message: string, originalError?: any) {
    super(`Database operation failed: ${message}`, { originalError: originalError?.message });
  }
}
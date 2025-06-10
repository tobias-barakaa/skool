import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(message: string, statusCode: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, statusCode);
  }
}

export class UserAlreadyExistsException extends BusinessException {
  constructor(email: string) {
    super(`User with email '${email}' already exists`, HttpStatus.CONFLICT);
  }
}

export class SchoolNotFoundException extends BusinessException {
  constructor(schoolName: string) {
    super(`School '${schoolName}' not found`, HttpStatus.NOT_FOUND);
  }
}
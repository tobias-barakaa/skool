// src/common/exceptions/business.exception.ts
export class UserAlreadyExistsException extends Error {
  constructor(email: string) {
    super(`User with email ${email} already exists`);
    this.name = 'UserAlreadyExistsException';
  }
}

export class SchoolAlreadyExistsException extends Error {
  constructor(subdomain: string) {
    super(`School with subdomain ${subdomain} already exists`);
    this.name = 'SchoolAlreadyExistsException';
  }
}
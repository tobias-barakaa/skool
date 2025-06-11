import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { UserAlreadyExistsException, SchoolAlreadyExistsException } from '../exceptions/business.exception';

@Catch(UserAlreadyExistsException, SchoolAlreadyExistsException)
export class BusinessExceptionFilter extends BaseExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = 400;
    let message = exception.message;

    if (exception instanceof UserAlreadyExistsException) {
      status = 409; // Conflict
    } else if (exception instanceof SchoolAlreadyExistsException) {
      status = 409; // Conflict
    }

    response.status(status).json({
      statusCode: status,
      message: message,
      error: exception.name,
    });
  }
}
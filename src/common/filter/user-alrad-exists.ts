import { ArgumentsHost, Catch, ExceptionFilter, NotFoundException } from '@nestjs/common';
import { GqlArgumentsHost, GqlExceptionFilter } from '@nestjs/graphql';
import { EntityNotFoundError } from 'typeorm';
import { UserAlreadyExistsException } from '../exceptions/business.exception';

@Catch(UserAlreadyExistsException)
export class UserAlreadyExistException<T> implements GqlExceptionFilter {
  catch(exception: UserAlreadyExistsException, host: ArgumentsHost) {
    GqlArgumentsHost.create(host);
    return new NotFoundException('User already exists with this email')
  }
}





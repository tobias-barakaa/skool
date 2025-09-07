import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception';

export class StudentAlreadyAssignedToRouteException extends BusinessException {
  constructor(studentName: string, routeName: string, metadata?: Record<string, any>) {
    super(
      `Student ${studentName} is already assigned to route ${routeName}`,
      'STUDENT_ALREADY_ASSIGNED_TO_ROUTE',
      HttpStatus.CONFLICT,
      metadata,
    );
    this.name = 'StudentAlreadyAssignedToRouteException';
  }
}

// custom-logger.service.ts
import { ConsoleLogger, Injectable } from '@nestjs/common';

@Injectable()
export class CustomLogger extends ConsoleLogger {
  error(message: any, stack?: string, context?: string) {
    // Suppress specific GraphQL validation errors
    if (
      typeof message === 'string' &&
      message.includes('String cannot represent a non string value')
    ) {
      return;
    }

    super.error(message, stack, context);
  }
}

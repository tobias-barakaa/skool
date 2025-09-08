import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { SchoolSetupGuardService } from 'src/admin/config/school-config.guard';
import { REQUEST_USER_KEY } from 'src/admin/auth/constants/auth.constants';

@Injectable()
export class SchoolConfiguredGuard implements CanActivate {
  private readonly logger = new Logger(SchoolConfiguredGuard.name);

  constructor(
    private readonly schoolSetupGuardService: SchoolSetupGuardService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(
      'skipSchoolConfigCheck',
      [context.getHandler(), context.getClass()],
    );
    
    if (skip) {
      this.logger.debug('Skipping school configuration check');
      return true;
    }

    let request: any;
    if (context.getType<any>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      request = gqlContext.getContext().req;
    } else {
      request = context.switchToHttp().getRequest();
    }

    const user = request[REQUEST_USER_KEY];
    
    if (!user || !user.tenantId) {
      this.logger.warn('No authenticated user or tenant ID found');
      throw new ForbiddenException('Authentication required');
    }

    this.logger.debug(`Checking school configuration for tenant: ${user.tenantId}`);

    try {
      await this.schoolSetupGuardService.validateSchoolIsConfigured(user.tenantId);
      return true;
    } catch (error) {
      this.logger.error(`School configuration check failed: ${error.message}`);
      throw error;
    }
  }
}
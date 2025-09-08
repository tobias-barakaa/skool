import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { SchoolSetupGuardService } from 'src/admin/config/school-config.guard';
import { REQUEST_USER_KEY } from 'src/admin/auth/constants/auth.constants';
import { AUTH_TYPE_KEY } from 'src/admin/auth/constants/auth.constants';
import { AuthType } from 'src/admin/auth/enums/auth-type.enum';

@Injectable()
export class SchoolConfiguredGuard implements CanActivate {
  private readonly logger = new Logger(SchoolConfiguredGuard.name);

  constructor(
    private readonly schoolSetupGuardService: SchoolSetupGuardService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipSchoolConfig = this.reflector.getAllAndOverride<boolean>(
      'skipSchoolConfigCheck',
      [context.getHandler(), context.getClass()],
    );
    
    if (skipSchoolConfig) {
      this.logger.debug('Skipping school configuration check');
      return true;
    }

    const authTypes = this.reflector.getAllAndOverride<AuthType[]>(AUTH_TYPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (authTypes?.includes(AuthType.None)) {
      this.logger.debug('AuthType.None detected, skipping school configuration check');
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
    
    if (!user) {
      this.logger.debug('No authenticated user found, skipping school configuration check');
      return true;
    }

    if (!user.tenantId) {
      this.logger.warn('User found but no tenant ID present');
      throw new ForbiddenException('Tenant information missing');
    }

    this.logger.debug(`Checking school configuration for tenant: ${user.tenantId}`);

    try {
      await this.schoolSetupGuardService.validateSchoolIsConfigured(user.tenantId);
      this.logger.debug(`School configuration validated for tenant: ${user.tenantId}`);
      return true;
    } catch (error) {
      this.logger.error(`School configuration check failed: ${error.message}`);
      throw error;
    }
  }
}
import { 
  Injectable, 
  CanActivate, 
  ExecutionContext, 
  ForbiddenException, 
  Logger 
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { SchoolSetupGuardService } from 'src/admin/config/school-config.guard';
import { REQUEST_USER_KEY } from 'src/admin/auth/constants/auth.constants';
import { AUTH_TYPE_KEY } from 'src/admin/auth/constants/auth.constants';
import { AuthType } from 'src/admin/auth/enums/auth-type.enum';
import { GlobalRole } from 'src/admin/users/entities/user.entity';

@Injectable()
export class SchoolConfiguredGuard implements CanActivate {
  private readonly logger = new Logger(SchoolConfiguredGuard.name);

  constructor(
    private readonly schoolSetupGuardService: SchoolSetupGuardService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check for skip decorator
    const skipSchoolConfig = this.reflector.getAllAndOverride<boolean>(
      'skipSchoolConfigCheck',
      [context.getHandler(), context.getClass()],
    );
    
    if (skipSchoolConfig) {
      this.logger.debug('Skipping school configuration check via decorator');
      return true;
    }

    // Check for public endpoints (AuthType.None)
    const authTypes = this.reflector.getAllAndOverride<AuthType[]>(
      AUTH_TYPE_KEY, 
      [context.getHandler(), context.getClass()]
    );

    if (authTypes?.includes(AuthType.None)) {
      this.logger.debug('AuthType.None detected, skipping school configuration check');
      return true;
    }

    // Extract request
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

    // **NEW: Check for Global Admin - they bypass school configuration checks**
    if (user.globalRole === GlobalRole.SUPER_ADMIN) {
      this.logger.debug(`Global admin detected (${user.email}), bypassing school configuration check`);
      return true;
    }

    // For regular users, tenant ID is required
    if (!user.tenantId) {
      this.logger.warn(`User ${user.email} has no tenant ID and is not a global admin`);
      throw new ForbiddenException('Tenant information missing. Please access through your school subdomain.');
    }

    this.logger.debug(`Checking school configuration for tenant: ${user.tenantId}`);

    try {
      await this.schoolSetupGuardService.validateSchoolIsConfigured(user.tenantId);
      this.logger.debug(`School configuration validated for tenant: ${user.tenantId}`);
      return true;
    } catch (error) {
      this.logger.error(`School configuration check failed: ${error.message}`);
      throw new ForbiddenException(
        'School setup incomplete. Please complete the school configuration before accessing this resource.'
      );
    }
  }
}

// import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { GqlExecutionContext } from '@nestjs/graphql';
// import { SchoolSetupGuardService } from 'src/admin/config/school-config.guard';
// import { REQUEST_USER_KEY } from 'src/admin/auth/constants/auth.constants';
// import { AUTH_TYPE_KEY } from 'src/admin/auth/constants/auth.constants';
// import { AuthType } from 'src/admin/auth/enums/auth-type.enum';

// @Injectable()
// export class SchoolConfiguredGuard implements CanActivate {
//   private readonly logger = new Logger(SchoolConfiguredGuard.name);

//   constructor(
//     private readonly schoolSetupGuardService: SchoolSetupGuardService,
//     private readonly reflector: Reflector,
//   ) {}

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const skipSchoolConfig = this.reflector.getAllAndOverride<boolean>(
//       'skipSchoolConfigCheck',
//       [context.getHandler(), context.getClass()],
//     );
    
//     if (skipSchoolConfig) {
//       this.logger.debug('Skipping school configuration check');
//       return true;
//     }

//     const authTypes = this.reflector.getAllAndOverride<AuthType[]>(AUTH_TYPE_KEY, [
//       context.getHandler(),
//       context.getClass(),
//     ]);

//     if (authTypes?.includes(AuthType.None)) {
//       this.logger.debug('AuthType.None detected, skipping school configuration check');
//       return true;
//     }

//     let request: any;
//     if (context.getType<any>() === 'graphql') {
//       const gqlContext = GqlExecutionContext.create(context);
//       request = gqlContext.getContext().req;
//     } else {
//       request = context.switchToHttp().getRequest();
//     }

//     const user = request[REQUEST_USER_KEY];
    
//     if (!user) {
//       this.logger.debug('No authenticated user found, skipping school configuration check');
//       return true;
//     }

//     if (!user.tenantId) {
//       this.logger.warn('User found but no tenant ID present');
//       throw new ForbiddenException('Tenant information missing');
//     }

//     this.logger.debug(`Checking school configuration for tenant: ${user.tenantId}`);

//     try {
//       await this.schoolSetupGuardService.validateSchoolIsConfigured(user.tenantId);
//       this.logger.debug(`School configuration validated for tenant: ${user.tenantId}`);
//       return true;
//     } catch (error) {
//       this.logger.error(`School configuration check failed: ${error.message}`);
//       throw error;
//     }
//   }
// }


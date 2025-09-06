import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { SchoolSetupGuardService } from 'src/admin/config/school-config.guard';

@Injectable()
export class SchoolConfiguredGuard implements CanActivate {
  constructor(
    private readonly schoolSetupGuardService: SchoolSetupGuardService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.get<boolean>(
      'skipSchoolConfigCheck',
      context.getHandler(),
    );
    if (skip) return true;
  
    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req.user;
    const tenantId = user?.tenantId;
  
    if (!tenantId) throw new ForbiddenException('Tenant not found');
  
    await this.schoolSetupGuardService.validateSchoolIsConfigured(tenantId);
  
    return true;
  }
  
}

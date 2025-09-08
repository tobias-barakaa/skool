import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { TenantValidationProvider } from "../providers/tenant-validation.provider";
import { GqlContextType, GqlExecutionContext } from "@nestjs/graphql";
import { REQUEST_USER_KEY } from "../constants/auth.constants";
import { ActiveUserData } from "../interface/active-user.interface";


// Update your TenantAccessGuard to check for this metadata
@Injectable()
export class TenantAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tenantValidationService: TenantValidationProvider,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipTenantValidation = this.reflector.getAllAndOverride<boolean>(
      'skipTenantValidation',
      [context.getHandler(), context.getClass()],
    );

    if (skipTenantValidation) {
      return true;
    }

    let request:any;
    
    if (context.getType<GqlContextType>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      request = gqlContext.getContext().req;
    } else {
      request = context.switchToHttp().getRequest();
    }

    const user = request[REQUEST_USER_KEY] as ActiveUserData;
    const tenantIdFromCookie = request.cookies?.tenant_id;

    if (!user || !tenantIdFromCookie) {
      throw new UnauthorizedException('Authentication required');
    }

    if (user.tenantId !== tenantIdFromCookie) {
      throw new ForbiddenException('Tenant mismatch');
    }

    const validation = await this.tenantValidationService.validateUserTenantAccess(
      user.sub,
      user.tenantId
    );

    request.tenant = validation.tenant;
    request.membership = validation.membership;

    return true;
  }
}
// import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
// import { Reflector } from "@nestjs/core";
// import { GqlContextType, GqlExecutionContext } from "@nestjs/graphql";
// import { REQUEST_USER_KEY } from "../../constants/auth.constants";
// import { ActiveUserData } from "../../interface/active-user.interface";
// import { TenantValidationProvider } from "../../providers/tenant-validation.provider";
// import { SKIP_TENANT_VALIDATION_KEY } from "../../decorator/skip-tenant-validation.decorator";

// @Injectable()
// export class TenantAccessGuard implements CanActivate {
//   constructor(
//     private reflector: Reflector,
//     private tenantValidationService: TenantValidationProvider,
//   ) {}

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const skipTenantValidation = this.reflector.getAllAndOverride<boolean>(
//       SKIP_TENANT_VALIDATION_KEY,
//       [context.getHandler(), context.getClass()],
//     );

//     if (skipTenantValidation) {
//       return true;
//     }

//     let request: any;
    
//     if (context.getType<GqlContextType>() === 'graphql') {
//       const gqlContext = GqlExecutionContext.create(context);
//       request = gqlContext.getContext().req;
//     } else {
//       request = context.switchToHttp().getRequest();
//     }

//     if (request.bypassTenant === true) {
//       return true;
//     }

//     const user = request[REQUEST_USER_KEY] as ActiveUserData;
//     const tenantIdFromCookie = request.cookies?.tenant_id;

//     if (!user || !tenantIdFromCookie) {
//       throw new UnauthorizedException('Authentication required');
//     }

//     if (!user.tenantId) {
//       throw new UnauthorizedException('Authentication required');
//     }

//     if (user.tenantId !== tenantIdFromCookie) {
//       throw new ForbiddenException('Tenant mismatch');
//     }

//     const validation = await this.tenantValidationService.validateUserTenantAccess(
//       user.sub,
//       user.tenantId
//     );

//     request.tenant = validation.tenant;
//     request.membership = validation.membership;

//     return true;
//   }
// }
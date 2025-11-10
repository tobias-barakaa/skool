import { 
    CanActivate, 
    ExecutionContext, 
    ForbiddenException, 
    Injectable 
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { GqlExecutionContext } from '@nestjs/graphql';
  import { REQUEST_USER_KEY } from '../../constants/auth.constants';
  import { GlobalRole } from 'src/admin/users/entities/user.entity';
import { SUPER_ADMIN_ONLY } from '../../decorator/super-admin.decorator';
  
  @Injectable()
  export class SuperAdminGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}
  
    canActivate(context: ExecutionContext): boolean {
      const requiresSuperAdmin = this.reflector.getAllAndOverride<boolean>(
        SUPER_ADMIN_ONLY,
        [context.getHandler(), context.getClass()]
      );
  
      // If resolver does NOT require Super Admin, this guard does nothing
      if (!requiresSuperAdmin) return true;
  
      // Extract request (GraphQL aware)
      let request: any;
      if ((context.getType() as string) === 'graphql') {
        const gqlCtx = GqlExecutionContext.create(context);
        request = gqlCtx.getContext().req;
      } else {
        request = context.switchToHttp().getRequest();
      }
  
      const user = request[REQUEST_USER_KEY];
  
      if (!user) {
        throw new ForbiddenException('Not authenticated');
      }
  
      if (user.globalRole !== GlobalRole.SUPER_ADMIN) {
        throw new ForbiddenException('Super Admin only');
      }
  
      // ✅ Important: bypass all other checks
      request.bypassTenant = true;
      request.bypassRoleCheck = true;
      request.bypassSchoolConfig = true;
  
      return true;
    }
  }
  
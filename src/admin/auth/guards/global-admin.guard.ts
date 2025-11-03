import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { REQUEST_USER_KEY } from '../constants/auth.constants';
import { GlobalRole } from 'src/admin/users/entities/user.entity';
import { IS_GLOBAL_ADMIN_KEY } from '../decorator/is-global-admin.decorator';

@Injectable()
export class GlobalAdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresGlobalAdmin = this.reflector.getAllAndOverride<boolean>(
      IS_GLOBAL_ADMIN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiresGlobalAdmin) return true;

    let request: any;
    if (context.getType<GqlExecutionContext>() === 'graphql') {
      request = GqlExecutionContext.create(context).getContext().req;
    } else {
      request = context.switchToHttp().getRequest();
    }

    const user = request[REQUEST_USER_KEY];

    if (!user || user.globalRole !== GlobalRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can access this resource');
    }

    return true;
  }
}

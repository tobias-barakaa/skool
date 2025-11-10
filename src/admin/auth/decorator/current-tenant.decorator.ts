import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { REQUEST_USER_KEY } from '../constants/auth.constants';
import { GlobalRole } from 'src/admin/users/entities/user.entity';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { ActiveUserData } from '../interface/active-user.interface';

/**
 * Extract tenant ID from authenticated user
 * Returns null for super admins
 */
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = extractRequest(ctx);
    const user: ActiveUserData | undefined = request[REQUEST_USER_KEY];
    
    if (!user) return null;
    if (user.globalRole === GlobalRole.SUPER_ADMIN) return null;
    
    return user.tenantId || null;
  },
);

// Helper function for both HTTP and GraphQL contexts
function extractRequest(ctx: ExecutionContext): any {
  if (ctx.getType<GqlContextType>() === 'graphql') {
    const gqlContext = GqlExecutionContext.create(ctx);
    return gqlContext.getContext().req;
  }
  return ctx.switchToHttp().getRequest();
}
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { REQUEST_USER_KEY } from "../constants/auth.constants";
import { GlobalRole } from "src/admin/users/entities/user.entity";

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = GqlExecutionContext.create(context).getContext().req;
    const user = req[REQUEST_USER_KEY];

    if (user && user.globalRole === GlobalRole.SUPER_ADMIN) {
      return true;
    }

    throw new ForbiddenException('Super admin access only');
  }
}

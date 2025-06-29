import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessTokenGuard } from './access-token.guard';
import { AuthType } from '../enums/auth-type.enum';
import { AUTH_TYPE_KEY } from '../constants/auth.constants';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  private static readonly defaultAuthType = AuthType.Bearer;

  private readonly authTypeGuardMap: Record<
    AuthType,
    CanActivate | CanActivate[]
  >;

  constructor(
    private readonly reflector: Reflector,
    private readonly accessTokenGuard: AccessTokenGuard,
  ) {
    this.authTypeGuardMap = {
      [AuthType.Bearer]: this.accessTokenGuard,
      [AuthType.None]: { canActivate: () => true },
    };
  } 

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get auth types from metadata or default
    const authTypes =
      this.reflector.getAllAndOverride<AuthType[]>(AUTH_TYPE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [AuthenticationGuard.defaultAuthType];

    console.log('authTypes', authTypes);

    // Flatten guards
    const guards = authTypes
      .map((type) => this.authTypeGuardMap[type])
      .flat(); // 🛠 FIXED: added () to call .flat

    console.log('guards', guards);

    const error = new UnauthorizedException();

    for (const instance of guards) {
      try {
        const canActivate = await Promise.resolve(
          instance.canActivate(context),
        );
        console.log(canActivate, 'canActivate');

        if (canActivate) {
          return true;
        }
      } catch (err) {
        console.error('Guard error:', err);
      }
    }

    throw error;
  }
}

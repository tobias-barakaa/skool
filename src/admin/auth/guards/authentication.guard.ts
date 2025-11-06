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

  private readonly authTypeGuardMap: Record<AuthType, CanActivate | CanActivate[]>;

  constructor(
    private readonly reflector: Reflector,
    private readonly accessTokenGuard: AccessTokenGuard,
  ) {
    this.authTypeGuardMap = {
      [AuthType.Bearer]: this.accessTokenGuard,
      [AuthType.SuperAdmin]: { canActivate: () => true },
      [AuthType.None]: { canActivate: () => true },
    };
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {

    // ✅ 1. PUBLIC ROUTE CHECK
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
    if (isPublic) {
      // console.log('Public route → skipping auth');
      return true;
    }

    // ✅ 2. DETERMINE AUTH TYPE (Default = Bearer)
    const authTypes =
      this.reflector.getAllAndOverride<AuthType[]>(AUTH_TYPE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [AuthenticationGuard.defaultAuthType];

    // console.log('authTypes', authTypes);

    // ✅ 3. MAP AUTH TYPES TO GUARD INSTANCES
    const guards = authTypes.map((type) => this.authTypeGuardMap[type]).flat();

    const error = new UnauthorizedException();

    // ✅ 4. RUN GUARDS
    for (const instance of guards) {
      try {
        const canActivate = await Promise.resolve(instance.canActivate(context));
        if (canActivate) return true;
      } catch (err) {
        // console.error('Guard error:', err);
      }
    }

    throw error;
  }
}


// import {
//   CanActivate,
//   ExecutionContext,
//   Injectable,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { AccessTokenGuard } from './access-token.guard';
// import { AuthType } from '../enums/auth-type.enum';
// import { AUTH_TYPE_KEY } from '../constants/auth.constants';

// @Injectable()
// export class AuthenticationGuard implements CanActivate {
//   private static readonly defaultAuthType = AuthType.Bearer;

//   private readonly authTypeGuardMap: Record<
//     AuthType,
//     CanActivate | CanActivate[]
//   >;

//   constructor(
//     private readonly reflector: Reflector,
//     private readonly accessTokenGuard: AccessTokenGuard,
//   ) {
//     this.authTypeGuardMap = {
//       // [AuthType.Bearer]: this.accessTokenGuard,
//       // [AuthType.None]: { canActivate: () => true },

//       [AuthType.Bearer]: this.accessTokenGuard,
//       [AuthType.SuperAdmin]: { canActivate: () => true },
//       [AuthType.None]: { canActivate: () => true },
//     };
//   } 

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const authTypes =
//       this.reflector.getAllAndOverride<AuthType[]>(AUTH_TYPE_KEY, [
//         context.getHandler(),
//         context.getClass(),
//       ]) ?? [AuthenticationGuard.defaultAuthType];

//     console.log('authTypes', authTypes);

//     const guards = authTypes
//       .map((type) => this.authTypeGuardMap[type])
//       .flat();

//     console.log('guards', guards);

//     const error = new UnauthorizedException();

//     for (const instance of guards) {
//       try {
//         const canActivate = await Promise.resolve(
//           instance.canActivate(context),
//         );
//         console.log(canActivate, 'canActivate');

//         if (canActivate) {
//           return true;
//         }
//       } catch (err) {
//         console.error('Guard error:', err);
//       }
//     }

//     throw error;
//   }
// }

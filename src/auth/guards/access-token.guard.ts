import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from 'src/auth/config/jwt.config';
import { REQUEST_USER_KEY } from 'src/auth/constants/auth.constants';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlContext = GqlExecutionContext.create(context);
    // console.log(gqlContext, 'just get me one........');
    const request = gqlContext.getContext().req;
    // console.log(request, 'request in access token guard');
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, this.jwtConfiguration);
      request[REQUEST_USER_KEY] = payload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [_, token] = request.headers?.authorization?.split(' ') ?? [];
    return token;
  }
}







// import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
// import { ConfigType } from '@nestjs/config';
// import { JwtService } from '@nestjs/jwt';
// import { Observable } from 'rxjs';
// import jwtConfig from 'src/auth/config/jwt.config';
// import { Request } from 'express';
// import { REQUEST_USER_KEY } from '../constants/auth.constants';
// import { GqlExecutionContext } from '@nestjs/graphql';


// @Injectable()
// export class AccessTokenGuard implements CanActivate {
//   constructor(
//     /**
//      * Inject jwtService
//      */
//     private readonly jwtService: JwtService,
//     /**
//      * Inject jwtConfiguration
//      */
//     @Inject(jwtConfig.KEY)
//     private readonly jwtConfiguration: ConfigType<typeof jwtConfig>
//   ) {}
//   async canActivate(
//     context: ExecutionContext,
//   ): Promise<boolean> {
//     // extract the request from the execution context
//     // const request = context.switchToHttp().getRequest();

// const gqlContext = GqlExecutionContext.create(context);
// const request = gqlContext.getContext().req;
//     // extract the token from the header
//     const token = this.extractRequestFromHeader(request);
//     // validate the token
//     if(!token) {
//       throw new UnauthorizedException('Token not found');
//     }
//     try {
//       const payload = await this.jwtService.verifyAsync(token, this.jwtConfiguration)
//       request[REQUEST_USER_KEY] = payload;
      
//     } catch (error) {
//       throw new UnauthorizedException('Invalid token');
      
//     }

//     return true;
//   }

//   private extractRequestFromHeader(request: Request): string | undefined {
//     const [_, token] = request.headers.authorization?.split(' ') ?? [];
//     return token;
//   }
// }

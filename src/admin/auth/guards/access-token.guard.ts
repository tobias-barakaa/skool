import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { ConfigType } from '@nestjs/config';
  import { JwtService } from '@nestjs/jwt';
  import jwtConfig from '../config/jwt.config';
  import { REQUEST_USER_KEY } from '../constants/auth.constants';
import { ActiveUserData } from '../interface/active-user.interface';
  
  /**
   * Validates JWT access token and attaches user to request
   * Does not perform tenant or role validation
   */
  @Injectable()
  export class AccessTokenGuard implements CanActivate {
    constructor(
      private readonly jwtService: JwtService,
      @Inject(jwtConfig.KEY)
      private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    ) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = this.extractRequest(context);
      const token = this.extractToken(request);
  
      if (!token) {
        throw new UnauthorizedException('Access token not found');
      }
  
      try {
        const payload = await this.jwtService.verifyAsync<ActiveUserData>(
          token,
          this.jwtConfiguration,
        );
  
        request[REQUEST_USER_KEY] = payload;
        return true;
      } catch (err) {
        throw new UnauthorizedException('Invalid or expired access token');
      }
    }
  
    private extractRequest(context: ExecutionContext): any {
      if (context.getType<any>() === 'graphql') {
        const GqlExecutionContext = require('@nestjs/graphql').GqlExecutionContext;
        return GqlExecutionContext.create(context).getContext().req;
      }
      return context.switchToHttp().getRequest();
    }
  
    private extractToken(request: any): string | undefined {
      // Check Authorization header
      const authHeader = request.headers?.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
  
      // Check cookie
      return request.cookies?.['access_token'];
    }
  }
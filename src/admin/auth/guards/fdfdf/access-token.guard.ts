import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import jwtConfig from 'src/admin/auth/config/jwt.config';
import { REQUEST_USER_KEY } from 'src/admin/auth/constants/auth.constants';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  private readonly logger = new Logger(AccessTokenGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlContext = GqlExecutionContext.create(context);
    const request = gqlContext.getContext().req;
    const token = this.extractToken(request);

    if (!token) {
      this.logger.warn('No token found in header or cookies');
      throw new UnauthorizedException('Access token not found');
    }

    

    try {
      const payload = await this.jwtService.verifyAsync(
        token,
        this.jwtConfiguration,
      );
    
      this.logger.debug(
        `Decoded JWT payload::::::::::::PSYPPPDIFU::::DJFIDJFIDJSODIFJIS: ${JSON.stringify(payload, null, 2)}`
      );
    
      // ✅ SUPER ADMIN BYPASS
      if (payload.globalRole === 'SUPER_ADMIN') {
        this.logger.debug('✅ Super Admin detected → bypassing tenantId requirement');
        request[REQUEST_USER_KEY] = payload;
        return true;
      }
    
      // ✅ NORMAL USER FLOW
      request[REQUEST_USER_KEY] = payload;
      return true;
    } catch (err: any) {
      
      if (err instanceof TokenExpiredError) {
        this.logger.warn('JWT token has expired');
        throw new UnauthorizedException('Access token expired');
      }

      this.logger.error(`Token verification failed: ${err?.message || err}`);
      throw new UnauthorizedException('Invalid or corrupted access token');
    }
  }

  private extractToken(request: any): string | undefined {
    const authHeader = request.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      this.logger.debug('Token found in Authorization header');
      return authHeader.split(' ')[1];
    }

    const cookieToken = request.cookies?.['access_token'];
    if (cookieToken) {
      this.logger.debug('Token found in access_token cookie');
      return cookieToken;
    }

    this.logger.debug('No token found in request');
    return undefined;
  }
}

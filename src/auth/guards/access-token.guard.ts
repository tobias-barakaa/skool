import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from 'src/auth/config/jwt.config';
import { REQUEST_USER_KEY } from '../constants/auth.constants';
import { Tenant } from 'src/tenants/entities/tenant.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserTenantMembership } from 'src/user-tenant-membership/entities/user-tenant-membership.entity';
import { UserNotInTenantException } from 'src/common/exceptions/business.exception';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(UserTenantMembership)
    private readonly membershipRepo: Repository<UserTenantMembership>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlContext = GqlExecutionContext.create(context);
    const request = gqlContext.getContext().req;

    console.log('🛡️ JWT Config:', this.jwtConfiguration);

    const token = this.extractTokenFromHeader(request);
    if (!token) throw new UnauthorizedException('Token not found');

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token, this.jwtConfiguration);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const subdomain = this.extractSubdomainFromCookies(request);
    if (!subdomain) throw new UnauthorizedException('Missing subdomain cookie');

    const tenant = await this.tenantRepo.findOne({ where: { subdomain } });
    if (!tenant) throw new UnauthorizedException(`Tenant '${subdomain}' not found`);

    const membership = await this.membershipRepo.findOne({
      where: {
        userId: payload.sub,
        tenantId: tenant.id,
      },
      relations: ['user', 'tenant'],
    });

    if (!membership) {
      throw new UserNotInTenantException(payload.sub, tenant.id);
    }

    request[REQUEST_USER_KEY] = {
      sub: payload.sub,
      email: payload.email,
      tenantId: tenant.id,
      subdomain: tenant.subdomain,
      membershipId: membership.id,
    };

    console.log('✅ Authenticated user and tenant:', request[REQUEST_USER_KEY]);

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [_, token] = request.headers?.authorization?.split(' ') ?? [];
    return token;
  }

  private extractSubdomainFromCookies(request: any): string | undefined {
    const subdomain = request.cookies?.schoolUrl;
    console.log('🍪 Extracted subdomain from cookie:', subdomain);
    return subdomain;
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

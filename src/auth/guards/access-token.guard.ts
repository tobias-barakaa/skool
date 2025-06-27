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
import { extractSubdomain } from 'src/common/utils/host.utils';
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

    const token = this.extractTokenFromHeader(request);
    if (!token) throw new UnauthorizedException('Token not found');

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token, this.jwtConfiguration);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    const host = request.headers.host;
    // const host = "wedkdwamdanaye.squl.co.ke";
    
    const subdomain = extractSubdomain(host);
    if (!subdomain) throw new UnauthorizedException('Subdomain not found in host');

    const tenant = await this.tenantRepo.findOne({ where: { subdomain } });
    console.log(`Tenant found: ${tenant ? tenant.id : 'None'}`, tenant);
    if (!tenant) throw new UnauthorizedException('Tenant not found');
    console.log(`Checking membership for user ${payload.sub} in tenant ${tenant.id}`);

    const membership = await this.membershipRepo.findOne({
      where: {
        userId: payload.sub,
        tenantId: tenant.id
      },
      relations: ['user', 'tenant']
    });

    if (!membership) {
      throw new UserNotInTenantException(payload.sub, tenant.id);
    }
    

    // Attach enriched payload
    request[REQUEST_USER_KEY] = {
      sub: payload.sub,
      email: payload.email,
      tenantId: tenant.id,
      subdomain: tenant.subdomain,
      membershipId: membership.id,
    };

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

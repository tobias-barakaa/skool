import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import jwtConfig from '../config/jwt.config';
import { ActiveUserData } from '../interface/active-user.interface';
import { HashingProvider } from './hashing.provider';
import { User } from 'src/admin/users/entities/user.entity';
import { UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';

@Injectable()
export class GenerateTokenProvider {
  constructor(
    private readonly hashingProvider: HashingProvider,

    private readonly jwtService: JwtService,

    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  public async signToken<T>(userId: string, expiresIn: number, payload?: T) {
    console.log(
      'Signing token with payload:',
      payload,
      'userId:',
      userId,
      'expiresIn:',
      expiresIn,
    );

    return await this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn,
      },
    );
  }


  public async generateTokens(
    user: User,
    membership?: UserTenantMembership,
    tenant?: Tenant,
  ) {
    if (!tenant || !membership) {
      throw new Error(
        'Tenant and membership must be provided to generate tokens',
      );
    }

    const tenantContext: Partial<ActiveUserData> = {
      email: user.email,
      tenantId: tenant.id,
      subdomain: tenant.subdomain,
      membershipId: membership.id,
      isGlobalAdmin: user.isGlobalAdmin ?? false,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.signToken<Partial<ActiveUserData>>(
        user.id,
        this.jwtConfiguration.accessTokenTtl,
        tenantContext,
      ),
      this.signToken(
        user.id,
        this.jwtConfiguration.refreshTokenTtl,
        tenantContext,
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }




  public async generateSuperAdminTokens(user: User) {
    const superAdminContext: Partial<ActiveUserData> & { role?: string } = {
      email: user.email,
  
      isGlobalAdmin: true,
  
      tenantId: undefined,
      membershipId: undefined,
      subdomain: "global-admin",
  
      role: "SUPER_ADMIN",
    };
  
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken<Partial<ActiveUserData>>(
        user.id,
        this.jwtConfiguration.accessTokenTtl,
        superAdminContext,
      ),
      this.signToken(
        user.id,
        this.jwtConfiguration.refreshTokenTtl,
        superAdminContext,
      ),
    ]);
  
    return {
      accessToken,
      refreshToken,
    };
  }
  
  
}

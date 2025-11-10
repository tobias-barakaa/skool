import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import jwtConfig from '../config/jwt.config';
import { User } from 'src/admin/users/entities/user.entity';
import { UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import { GlobalRole } from 'src/admin/users/entities/user.entity';
import { ActiveUserData } from '../interface/active-user.interface';

@Injectable()
export class TokenProvider {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  /**
   * Generate tokens for regular tenant users
   */
  async generateTenantUserTokens(
    user: User,
    membership: UserTenantMembership,
    tenant: Tenant,
  ) {
    const payload: Partial<ActiveUserData> = {
      sub: user.id,
      email: user.email,
      tenantId: tenant.id,
      subdomain: tenant.subdomain,
      membershipId: membership.id,
      role: membership.role,
    };

    return this.generateTokenPair(payload);
  }

  /**
   * Generate tokens for super admin
   */
  async generateSuperAdminTokens(user: User) {
    const payload: Partial<ActiveUserData> = {
      sub: user.id,
      email: user.email,
      globalRole: GlobalRole.SUPER_ADMIN,
    };

    return this.generateTokenPair(payload);
  }

  private async generateTokenPair(payload: Partial<ActiveUserData>) {
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken(payload, this.jwtConfiguration.accessTokenTtl),
      this.signToken(payload, this.jwtConfiguration.refreshTokenTtl),
    ]);

    return { accessToken, refreshToken };
  }

  private async signToken(payload: Partial<ActiveUserData>, expiresIn: number) {
    return this.jwtService.signAsync(payload, {
      audience: this.jwtConfiguration.audience,
      issuer: this.jwtConfiguration.issuer,
      secret: this.jwtConfiguration.secret,
      expiresIn,
    });
  }
}

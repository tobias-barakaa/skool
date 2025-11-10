
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
import jwtConfig from '../config/jwt.config';
import { ActiveUserData } from '../interface/active-user.interface';
import { HashingProvider } from './hashing.provider';
import { GlobalRole, User } from 'src/admin/users/entities/user.entity';
import { UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';

@Injectable()
export class GenerateTokenProvider {
  constructor(
    private readonly hashingProvider: HashingProvider,

    /**
     * Inject jwtService
     */
    private readonly jwtService: JwtService,

    /**
     * Inject jwtconfiguration
     */
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  public async signToken<T>(userId: string, expiresIn: number, payload?: T) {
    // console.log(
    //   'Signing token with payload:',
    //   payload,
    //   'userId:',
    //   userId,
    //   'expiresIn:',
    //   expiresIn,
    // );

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



  async generateSuperAdminToken(user: User) {
    if (user.globalRole !== GlobalRole.SUPER_ADMIN) {
      throw new Error("Not allowed");
    }
  
    const payload = {
      email: user.email,
      globalRole: GlobalRole.SUPER_ADMIN,
    };
  
    const accessToken = await this.signToken(
      user.id,
      this.jwtConfiguration.accessTokenTtl,
      payload
    );
  
    const refreshToken = await this.signToken(
      user.id,
      this.jwtConfiguration.refreshTokenTtl,
      payload
    );
  
    return { accessToken, refreshToken };
  }
  
}



// import { Inject, Injectable } from '@nestjs/common';
// import { ConfigType } from '@nestjs/config';
// import { JwtService } from '@nestjs/jwt';
// import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
// import jwtConfig from '../config/jwt.config';
// import { ActiveUserData } from '../interface/active-user.interface';
// import { HashingProvider } from './hashing.provider';
// import { User } from 'src/admin/users/entities/user.entity';
// import { UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';

// @Injectable()
// export class GenerateTokenProvider {
//   constructor(
//     private readonly hashingProvider: HashingProvider,
//     private readonly jwtService: JwtService,
//     @Inject(jwtConfig.KEY)
//     private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
//   ) {}

//   public async signToken<T>(userId: string, expiresIn: number, payload?: T) {
//     return await this.jwtService.signAsync(
//       {
//         sub: userId,
//         ...payload,
//       },
//       {
//         audience: this.jwtConfiguration.audience,
//         issuer: this.jwtConfiguration.issuer,
//         secret: this.jwtConfiguration.secret,
//         expiresIn,
//       },
//     );
//   }

//   public async generateTokens(
//     user: User,
//     membership?: UserTenantMembership,
//     tenant?: Tenant,
//   ) {
//     if (!tenant || !membership) {
//       throw new Error(
//         'Tenant and membership must be provided to generate tokens',
//       );
//     }

//     const tenantContext: Partial<ActiveUserData> = {
//       email: user.email,
//       globalRole: user.globalRole,
//       tenantId: tenant.id,
//       subdomain: tenant.subdomain,
//       membershipId: membership.id,
//       role: membership.role,
//     };

//     const [accessToken, refreshToken] = await Promise.all([
//       this.signToken<Partial<ActiveUserData>>(
//         user.id,
//         this.jwtConfiguration.accessTokenTtl,
//         tenantContext,
//       ),
//       this.signToken(
//         user.id,
//         this.jwtConfiguration.refreshTokenTtl,
//         tenantContext,
//       ),
//     ]);

//     return {
//       accessToken,
//       refreshToken,
//     };
//   }

//   /**
//    * Generate tokens for global admins (no tenant context required)
//    */
//   public async generateGlobalAdminTokens(user: User) {
//     const globalContext: Partial<ActiveUserData> = {
//       email: user.email,
//       globalRole: user.globalRole,
//       // No tenant context for global admins by default
//     };

//     const [accessToken, refreshToken] = await Promise.all([
//       this.signToken<Partial<ActiveUserData>>(
//         user.id,
//         this.jwtConfiguration.accessTokenTtl,
//         globalContext,
//       ),
//       this.signToken(
//         user.id,
//         this.jwtConfiguration.refreshTokenTtl,
//         globalContext,
//       ),
//     ]);

//     return {
//       accessToken,
//       refreshToken,
//     };
//   }

//   /**
//    * Generate tokens with specific tenant context (for switching tenants)
//    */
//   public async generateTokensWithTenant(
//     user: User,
//     tenantId: string,
//     membership: UserTenantMembership,
//     tenant: Tenant,
//   ) {
//     return this.generateTokens(user, membership, tenant);
//   }
// }

// // import { Inject, Injectable } from '@nestjs/common';
// // import { ConfigType } from '@nestjs/config';
// // import { JwtService } from '@nestjs/jwt';
// // import { Tenant } from 'src/admin/tenants/entities/tenant.entity';
// // import jwtConfig from '../config/jwt.config';
// // import { ActiveUserData } from '../interface/active-user.interface';
// // import { HashingProvider } from './hashing.provider';
// // import { User } from 'src/admin/users/entities/user.entity';
// // import { UserTenantMembership } from 'src/admin/user-tenant-membership/entities/user-tenant-membership.entity';

// // @Injectable()
// // export class GenerateTokenProvider {
// //   constructor(
// //     private readonly hashingProvider: HashingProvider,

// //     /**
// //      * Inject jwtService
// //      */
// //     private readonly jwtService: JwtService,

// //     /**
// //      * Inject jwtconfiguration
// //      */
// //     @Inject(jwtConfig.KEY)
// //     private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
// //   ) {}

// //   public async signToken<T>(userId: string, expiresIn: number, payload?: T) {
// //     console.log(
// //       'Signing token with payload:',
// //       payload,
// //       'userId:',
// //       userId,
// //       'expiresIn:',
// //       expiresIn,
// //     );

// //     return await this.jwtService.signAsync(
// //       {
// //         sub: userId,
// //         ...payload,
// //       },
// //       {
// //         audience: this.jwtConfiguration.audience,
// //         issuer: this.jwtConfiguration.issuer,
// //         secret: this.jwtConfiguration.secret,
// //         expiresIn,
// //       },
// //     );
// //   }


// //   public async generateTokens(
// //     user: User,
// //     membership?: UserTenantMembership,
// //     tenant?: Tenant,
// //   ) {
// //     if (!tenant || !membership) {
// //       throw new Error(
// //         'Tenant and membership must be provided to generate tokens',
// //       );
// //     }

// //     const tenantContext: Partial<ActiveUserData> = {
// //       email: user.email,
// //       tenantId: tenant.id,
// //       subdomain: tenant.subdomain,
// //       membershipId: membership.id,
// //     };

// //     const [accessToken, refreshToken] = await Promise.all([
// //       this.signToken<Partial<ActiveUserData>>(
// //         user.id,
// //         this.jwtConfiguration.accessTokenTtl,
// //         tenantContext,
// //       ),
// //       this.signToken(
// //         user.id,
// //         this.jwtConfiguration.refreshTokenTtl,
// //         tenantContext,
// //       ),
// //     ]);

// //     return {
// //       accessToken,
// //       refreshToken,
// //     };
// //   }



// //   public async generateTokensForSuperAdmin(
// //     user: User,
// //     membership?: UserTenantMembership, // Make these optional
// //     tenant?: Tenant, // Make these optional
// //   ) {
// //     // Determine the context. For Super Admin, it might not have tenant/membership info.
// //     // The key is to always include the globalRole.
    
// //     const tenantContext: Partial<ActiveUserData> = {
// //       email: user.email,
// //       globalRole: user.globalRole, // <<--- Add globalRole here
// //       // Only include these if they are present (for non-Super Admin sign-ins)
// //       ...(tenant && { tenantId: tenant.id, subdomain: tenant.subdomain }),
// //       ...(membership && { membershipId: membership.id }),
// //     };

// //     // The rest of your token generation logic remains the same, using user.id as 'sub'
// //     const [accessToken, refreshToken] = await Promise.all([
// //       this.signToken<Partial<ActiveUserData>>(
// //         user.id,
// //         this.jwtConfiguration.accessTokenTtl,
// //         tenantContext,
// //       ),
// //       this.signToken(
// //         user.id,
// //         this.jwtConfiguration.refreshTokenTtl,
// //         tenantContext,
// //       ),
// //     ]);

// //     return { accessToken, refreshToken };
// //   }
// // }

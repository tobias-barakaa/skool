import { Inject, Injectable } from '@nestjs/common';
import jwtConfig from '../config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { HashingProvider } from './hashing.provider';
import { User } from 'src/users/entities/user.entity';
import { ActiveUserData } from '../interface/active-user.interface';

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
  console.log('Signing token with payload:', payload, 'userId:', userId, 'expiresIn:', expiresIn);

    return await this.jwtService.signAsync({
                sub: userId,
                ...payload,
    
            },{
                audience: this.jwtConfiguration.audience,
                issuer: this.jwtConfiguration.issuer,
                secret: this.jwtConfiguration.secret,
                expiresIn
    
            })
           
           
}


public async generateTokens(user: User) {
  const tenantContext: Partial<ActiveUserData> = {
    email: user.email,
    organizationId: user.organizationId, 
  };
  
    if (user.school) {
      tenantContext.schoolId = user.school.schoolId;
      tenantContext.schoolSubdomain = user.school.subdomain;
    }
  
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken<Partial<ActiveUserData>>(
        user.id,
        this.jwtConfiguration.accessTokenTtl,
        tenantContext
      ),
      this.signToken(
        user.id,
        this.jwtConfiguration.refreshTokenTtl,
        tenantContext
      ),
    ]);
  
    return {
      accessToken,
      refreshToken,
    };
  }
  
  






}

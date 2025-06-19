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


public async signToken<T>(userId: number, expiresIn: number, payload?: T) {
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
        parseInt(user.id),
        this.jwtConfiguration.accessTOKENTtl,
        tenantContext
      ),
      this.signToken(
        parseInt(user.id),
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

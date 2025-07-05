import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from '../config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { GenerateTokenProvider } from './generate-token.provider';
import { ActiveUserData } from '../interface/active-user.interface';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { UsersService } from 'src/admin/users/providers/users.service';

@Injectable()
export class RefreshTokensProvider {
    constructor(
        /**
         * Inject jwtService
         */
        private readonly jwtService: JwtService,
        /**
         * Inject jwtConfiguration
         */
        @Inject(jwtConfig.KEY)
        private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,

        /**
         * Inject generateTokensProvider
         */
        private readonly generateTokensProvider: GenerateTokenProvider,

        /**
         * Inject usersService
         */
         private readonly usersService: UsersService,
    ) {}
    public async refreshTokens(refreshTokenDto: RefreshTokenDto) {
        try {
              // verify the refresh token
      const {sub} =  await this.jwtService.verifyAsync<Pick <ActiveUserData, 'sub'>>(refreshTokenDto.refreshToken, {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
    })

    // Fetch user from the database
    const user = await this.usersService.findOneById(sub);

    // Generate the tokens
    return await this.generateTokensProvider.generateTokens(user);

        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');

        }

    }
}

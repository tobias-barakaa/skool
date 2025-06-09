import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthResolver } from './auth.resolver';
import { User } from '../users/entities/user.entity';
import { ColorPalette } from 'src/color-palletes/entities/color-palette.entity';
import { School } from 'src/school/entities/school.entity';
import { AuthService } from './providers/auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, School, ColorPalette]),
    // JwtModule.registerAsync({
    //   imports: [ConfigModule],
    //   useFactory: async (configService: ConfigService) => ({
    //     secret: configService.get('JWT_SECRET', 'your-secret-key'),
    //     signOptions: {
    //       expiresIn: configService.get('JWT_EXPIRES_IN', '7d'),
    //     },
    //   }),
    //   inject: [ConfigService],
    // }),
  ],
  providers: [AuthService, AuthResolver],
  exports: [AuthService],
})
export class AuthModule {}

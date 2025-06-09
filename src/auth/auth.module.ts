import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { ColorPalette } from 'src/color-palletes/entities/color-palette.entity';
import { AuthService } from './providers/auth.service';
import { SchoolsModule } from 'src/school/school.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([]),
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
    SchoolsModule
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}

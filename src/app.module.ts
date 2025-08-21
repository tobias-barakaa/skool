import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLError } from 'graphql';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { RedisModule } from '@nestjs-modules/ioredis';
import { AdminModule } from './admin/admin.module';
import jwtConfig from './admin/auth/config/jwt.config';
import { AccessTokenGuard } from './admin/auth/guards/access-token.guard';
import { AuthenticationGuard } from './admin/auth/guards/authentication.guard';
import { DataResponseInterceptor } from './admin/common/interceptor/data-response/data-response.interceptor';
import appConfig from './admin/config/app.config';
import databaseConfig from './admin/config/database.config';
import environmentValidation from './admin/config/environment.validation';
import redisConfig from './admin/config/redis.config';
import resendConfig from './admin/email/config/resend.config';
import { CommonModule } from './common/common.module';
import { MessagingModule } from './messaging/messaging.module';
import { StorageModule } from './modules/storage/storage.module';
import { TeacherModule } from './teacher/teacher.module';
import { TenantRoleGuard } from './iam/guards/tenant-role.guard';
import { IamModule } from './iam/iam.module';
import { SuperAdminModule } from './super_admin/super_admin.module';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: !ENV ? '.env.development' : `.env.${ENV}`,
      load: [appConfig, databaseConfig, resendConfig, redisConfig],
      validationSchema: environmentValidation,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        autoLoadEntities: configService.get('database.autoLoadEntities'),
        synchronize: configService.get('database.synchronize'),
        port: +configService.get('database.port'),
        username: configService.get('database.user'),
        password: configService.get('database.password'),
        host: configService.get('database.host'),
        database: configService.get('database.name'),
        ssl: { rejectUnauthorized: false },
      }),
    }),

    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),

      path: '/graphql',
      playground: true,
      sortSchema: true,
      validationRules: [],
      // context: ({ req }) => ({
      //   req,
      //   [REQUEST_USER_KEY]: req?.user,
      // }),

      context: ({ req, res }) => ({
        req,
        res,
        user: req.user,
      }),

      formatError: (error: GraphQLError) => {
        if (process.env.NODE_ENV === 'production') {
          const graphQLFormattedError = {
            message: error.message,
            locations: error.locations,
            path: error.path,
            extensions: {
              code: error.extensions?.code,
              httpStatus: error.extensions?.httpStatus,
              type: error.extensions?.type,
              ...(error.extensions?.email
                ? { email: error.extensions.email }
                : {}),
            },
          };
          return graphQLFormattedError;
        } else {
          return error;
        }
      },
    }),

    AdminModule,
    TeacherModule,
    StorageModule,
    MessagingModule,
    IamModule,

    RedisModule.forRoot({
      type: 'single',
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    }),

    CommonModule,

    SuperAdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    { provide: APP_GUARD, useClass: TenantRoleGuard },
    {
      provide: APP_INTERCEPTOR,
      useClass: DataResponseInterceptor,
    },
    AccessTokenGuard,
  ],
})
export class AppModule {}

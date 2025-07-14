import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join as pathJoin } from 'path';
import { GraphQLError } from 'graphql';
import { AppController } from './app.controller';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

import { AdminModule } from './admin/admin.module';
import appConfig from './admin/config/app.config';
import databaseConfig from './admin/config/database.config';
import resendConfig from './admin/email/config/resend.config';
import environmentValidation from './admin/config/environment.validation';
import jwtConfig from './admin/auth/config/jwt.config';
import { AuthenticationGuard } from './admin/auth/guards/authentication.guard';
import { DataResponseInterceptor } from './admin/common/interceptor/data-response/data-response.interceptor';
import { AccessTokenGuard } from './admin/auth/guards/access-token.guard';
import { StaffModule } from './admin/staff/staff.module';
import { TeacherModule } from './teacher/teacher.module';
import { StaffModule } from './staff/staff.module';
import { ParentModule } from './parent/parent.module';



const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: !ENV ? '.env.development' : `.env.${ENV}`,
      load: [appConfig, databaseConfig, resendConfig],
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


    StaffModule,


    TeacherModule,


    ParentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DataResponseInterceptor,
    },
    AccessTokenGuard,
  ],
})
export class AppModule {}
function join(arg0: string, arg1: string): import("@nestjs/graphql").AutoSchemaFileValue {
  return pathJoin(arg0, arg1);
}

import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import environmentValidation from './config/environment.validation';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join as pathJoin } from 'path';
import { SchoolsModule } from './school/school.module';
import { UserModule } from './users/users.module';
import { SchoolTypeModule } from './school-type/school-type.module';
import { TeacherModule } from './teacher/teacher.module';
import { ParentModule } from './parent/parent.module';
import { StudentModule } from './student/student.module';
import { GradeModule } from './grade/grade.module';
import { AttendanceModule } from './attendance/attendance.module';
import { SubjectModule } from './subject/subject.module';
import { ClassModule } from './class/class.module';
import { GraphQLError } from 'graphql';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthenticationGuard } from './auth/guards/authentication.guard';
import { DataResponseInterceptor } from './common/interceptor/data-response/data-response.interceptor';
import { AccessTokenGuard } from './auth/guards/access-token.guard';
import jwtConfig from './auth/config/jwt.config';
import { JwtModule } from '@nestjs/jwt';
import { OrganizationsModule } from './organizations/organizations.module';
import { TenantsModule } from './tenants/tenants.module';
import { LevelModule } from './level/level.module';
import { LevelService } from './level/providers/level.service';
import { SchoolLevelSettingModule } from './school-level-setting/school-level-setting.module';
import { CurriculumModule } from './curriculum/curriculum.module';
import { REQUEST_USER_KEY } from './auth/constants/auth.constants';
import { StreamsModule } from './streams/streams.module';
import { UserTenantMembershipModule } from './user-tenant-membership/user-tenant-membership.module';
import { InvitationModule } from './invitation/invitation.module';
import { TeacherProfilesModule } from './teacher_profiles/teacher_profiles.module';
import { EmailModule } from './email/email.module';
import resendConfig from './email/config/resend.config';



const ENV = process.env.NODE_ENV;

@Module({
  imports: [
   
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: !ENV ? '.env.development' : `.env.${ENV}`,
      load: [appConfig, databaseConfig,resendConfig],
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
        res, // ✅ <---- this is what fixes your issue
        user: req.user, // optional
      }),
      
      // context: ({ req, res }) => ({ req, res }),
      // context: ({ req }) => ({ req }),
      // This is the key part for error formatting
      formatError: (error: GraphQLError) => {
        // You can conditionally format errors based on environment
        if (process.env.NODE_ENV === 'production') {
          // In production, strip sensitive information like stack traces
          // and only include what your custom filter explicitly provides.
          const graphQLFormattedError = {
            message: error.message,
            locations: error.locations,
            path: error.path,
            extensions: {
              code: error.extensions?.code,
              httpStatus: error.extensions?.httpStatus,
              type: error.extensions?.type,
              // Only include other specific metadata you want to expose
              ...(error.extensions?.email ? { email: error.extensions.email } : {}),
              // ... any other safe metadata from your custom extensions
            },
          };
          return graphQLFormattedError;
        } else {
          // In development, return the full error for debugging
          // This will include the stacktrace provided by Apollo Server
          return error;
        }
      },
      // Other configurations like subscriptions, playground etc.
    }),
    

    UserModule,
    SchoolsModule,
    TeacherModule,
    SchoolTypeModule,
    ParentModule,
    StudentModule,
    GradeModule,
    AttendanceModule,
    SubjectModule,
    ClassModule,
    AuthModule,
    OrganizationsModule,
    TenantsModule,
    LevelModule,
    SchoolLevelSettingModule,
    CurriculumModule,
    StreamsModule,
    UserTenantMembershipModule,
    InvitationModule,
    TeacherProfilesModule,
    EmailModule,
    
 
    
  ],
  controllers: [AppController],
  providers: [AppService,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DataResponseInterceptor
    },
    AccessTokenGuard,
    LevelService
  
  ],
})
export class AppModule {}
function join(arg0: string, arg1: string): import("@nestjs/graphql").AutoSchemaFileValue {
  return pathJoin(arg0, arg1);
}


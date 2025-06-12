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
import { BranchModule } from './branch/branch.module';
import { SchoolTypeModule } from './school-type/school-type.module';
import { UserBranchModule } from './user-branch/user-branch.module';
import { TeacherModule } from './teacher/teacher.module';
import { ParentModule } from './parent/parent.module';
import { StudentModule } from './student/student.module';
import { GradeModule } from './grade/grade.module';
import { AttendanceModule } from './attendance/attendance.module';
import { SubjectModule } from './subject/subject.module';
import { ClassModule } from './class/class.module';
import { SchoolmanagerModule } from './schoolmanager/schoolmanager.module';
import { GraphQLError } from 'graphql';



const ENV = process.env.NODE_ENV;

@Module({
  imports: [
   
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: !ENV ? '.env.development' : `.env.${ENV}`,
      load: [appConfig, databaseConfig],
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

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      path: '/graphql',
      playground: true,
      sortSchema: true,
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
    BranchModule,
    TeacherModule,
    SchoolTypeModule,
    UserBranchModule,
    ParentModule,
    StudentModule,
    GradeModule,
    AttendanceModule,
    SubjectModule,
    ClassModule,
    SchoolmanagerModule,
    
 
    
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
function join(arg0: string, arg1: string): import("@nestjs/graphql").AutoSchemaFileValue {
  return pathJoin(arg0, arg1);
}


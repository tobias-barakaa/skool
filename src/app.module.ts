import { Module, Logger } from '@nestjs/common'; // <-- Import Logger
import { AppService } from './app.service';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import environmentValidation from './config/environment.validation';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import * as path from 'path'; // <-- Use standard path import
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
import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { SchoolAlreadyExistsException, UserAlreadyExistsException } from './common/exceptions/business.exception';


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
      // Use path.join for schema file path
      autoSchemaFile: path.join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      // playground: true, // Enable playground in development
      introspection: true, // Enable introspection in development
      context: ({ req, res }) => ({ req, res }), // Ensure context is passed

      formatError: (error: GraphQLError) => {
        const originalError = error.originalError; // The actual exception instance

        // Log the original error for debugging. This will show up in your NestJS console.
        Logger.error(
          `GraphQL Error: ${originalError?.name || error.name} - ${error.message}`,
          originalError?.stack || error.stack,
          'GraphQL'
        );

        let extensions: Record<string, any> = {
          code: error.extensions?.code || 'INTERNAL_SERVER_ERROR', // Default GraphQL error code
        };
        let message = error.message;
        
        // Handle your custom business exceptions
        if (originalError instanceof UserAlreadyExistsException) {
          message = originalError.message;
          extensions.code = 'USER_ALREADY_EXISTS';
          extensions.customType = originalError.name;
          extensions.httpStatus = 409; 
        } else if (originalError instanceof SchoolAlreadyExistsException) {
          message = originalError.message;
          extensions.code = 'SCHOOL_ALREADY_EXISTS';
          extensions.customType = originalError.name;
          extensions.httpStatus = 409;
        } 
        // Handle validation errors from class-validator/ValidationPipe
        else if (error.extensions?.code === 'BAD_USER_INPUT' && error.extensions?.exception) {
            // Check if 'response' exists and is an object, then access 'message'
            const validationResponse = (error.extensions.exception as any)?.response;
            if (validationResponse && typeof validationResponse === 'object' && 'message' in validationResponse) {
                message = 'Input validation failed.';
                extensions.validationErrors = validationResponse.message;
            }
            extensions.code = 'VALIDATION_ERROR';
            extensions.httpStatus = 400;
        } 
        // Catch-all for any other unexpected errors
        else if (originalError) {
            // For general errors, provide a generic message to clients
            message = 'An unexpected server error occurred.';
            extensions.code = 'UNEXPECTED_ERROR';
            // Include stack trace and original error details only in non-production environments
            if (process.env.NODE_ENV !== 'production') {
                extensions.originalErrorDetails = originalError.message;
                extensions.stack = originalError.stack;
            }
        }

        // Return the formatted error structure that will be sent to the client
        const formattedError: GraphQLFormattedError = {
          message: message,
          locations: error.locations,
          path: error.path,
          extensions: extensions,
        };

        return formattedError;
      },
      // Debug and playground should be true in development
      debug: process.env.NODE_ENV !== 'production',
      playground: process.env.NODE_ENV !== 'production',
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

// import { Module } from '@nestjs/common';
// import { AppService } from './app.service';
// import appConfig from './config/app.config';
// import databaseConfig from './config/database.config';
// import environmentValidation from './config/environment.validation';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { GraphQLModule } from '@nestjs/graphql';
// import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
// import { join as pathJoin } from 'path';
// import { SchoolsModule } from './school/school.module';
// import { UserModule } from './users/users.module';
// import { BranchModule } from './branch/branch.module';
// import { SchoolTypeModule } from './school-type/school-type.module';
// import { UserBranchModule } from './user-branch/user-branch.module';
// import { TeacherModule } from './teacher/teacher.module';
// import { ParentModule } from './parent/parent.module';
// import { StudentModule } from './student/student.module';
// import { GradeModule } from './grade/grade.module';
// import { AttendanceModule } from './attendance/attendance.module';
// import { SubjectModule } from './subject/subject.module';
// import { ClassModule } from './class/class.module';
// import { SchoolmanagerModule } from './schoolmanager/schoolmanager.module';
// import { GraphQLError, GraphQLFormattedError } from 'graphql';
// import { SchoolAlreadyExistsException, UserAlreadyExistsException } from './common/exceptions/business.exception';



// const ENV = process.env.NODE_ENV;

// @Module({
//   imports: [
   
//     ConfigModule.forRoot({
//       isGlobal: true,
//       envFilePath: !ENV ? '.env.development' : `.env.${ENV}`,
//       load: [appConfig, databaseConfig],
//       validationSchema: environmentValidation,
//     }),
//     TypeOrmModule.forRootAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],
//       useFactory: (configService: ConfigService) => ({
//         type: 'postgres',
//         autoLoadEntities: configService.get('database.autoLoadEntities'),
//         synchronize: configService.get('database.synchronize'),
//         port: +configService.get('database.port'),
//         username: configService.get('database.user'),
//         password: configService.get('database.password'),
//         host: configService.get('database.host'),
//         database: configService.get('database.name'),
//         ssl: { rejectUnauthorized: false },
//       }),
//     }),

//     // GraphQLModule.forRoot<ApolloDriverConfig>({
//     //   driver: ApolloDriver,
//     //   autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
//     //   sortSchema: true,
//     //   playground: true,
//     //   introspection: true,
//     //   context: ({ req, res }) => ({ req, res }),
//     // }),


//     GraphQLModule.forRoot<ApolloDriverConfig>({
//       driver: ApolloDriver,
//       autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
//       // autoSchemaFile: true, // or specify a path
//       formatError: (error: GraphQLError) => {
//         // This function is called for every error caught by Apollo Server
//         const originalError = error.originalError; // This will be your thrown exception instance

//         let extensions: Record<string, any> = {
//           code: error.extensions?.code || 'INTERNAL_SERVER_ERROR', // Default code
//         };
//         let message = error.message;

//         if (originalError instanceof UserAlreadyExistsException) {
//           message = originalError.message;
//           extensions.code = 'USER_ALREADY_EXISTS'; // Custom code for this specific business error
//           extensions.customType = originalError.name; // Add the exception name
//           extensions.httpStatus = 409; // You can add an HTTP status hint here, but the GraphQL response itself will still be 200 OK
//         } else if (originalError instanceof SchoolAlreadyExistsException) {
//           message = originalError.message;
//           extensions.code = 'SCHOOL_ALREADY_EXISTS';
//           extensions.customType = originalError.name;
//           extensions.httpStatus = 409;
//         } else if (error.extensions?.code === 'BAD_USER_INPUT') {
//           // This catches validation errors (e.g., from class-validator)
//           // NestJS's ValidationPipe for GraphQL often converts these to BAD_USER_INPUT
//           message = error.message;
//           extensions.validationErrors = 
//             error.extensions.exception && 
//             typeof error.extensions.exception === 'object' && 
//             'response' in error.extensions.exception 
//               ? (error.extensions.exception.response as { message?: any })?.message || null 
//               : null;
//         }

//         // Return the formatted error structure
//         const formattedError: GraphQLFormattedError = {
//           message: message,
//           locations: error.locations,
//           path: error.path,
//           extensions: extensions,
//         };

//         return formattedError;
//       },
//     }),

//     UserModule,
//     SchoolsModule,
//     BranchModule,
//     TeacherModule,
//     SchoolTypeModule,
//     UserBranchModule,
//     ParentModule,
//     StudentModule,
//     GradeModule,
//     AttendanceModule,
//     SubjectModule,
//     ClassModule,
//     SchoolmanagerModule,
 
    
//   ],
//   controllers: [],
//   providers: [AppService],
// })
// export class AppModule {}
// function join(arg0: string, arg1: string): import("@nestjs/graphql").AutoSchemaFileValue {
//   return pathJoin(arg0, arg1);
// }


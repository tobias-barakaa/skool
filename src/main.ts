import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    
    // Setup static assets BEFORE other middleware
    app.useStaticAssets(join(__dirname, '..', 'public'));
    
    // Enhanced CORS configuration
    app.enableCors({
      origin: ['http://localhost:3001', 'http://localhost:3000','https://n4g04o0w40ocwg4w4ok4cggg.zelisline.com/', 'http://localhost:5173'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true,
    });
    
    // Enhanced validation pipe
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map(error => ({
          field: error.property,
          errors: Object.values(error.constraints || {}),
        }));
        return new Error(`Validation failed: ${JSON.stringify(messages)}`);
      },
    }));

    // Apply GraphQL filter only to GraphQL context (not globally)
    // This should be configured in your GraphQL module instead
    // app.useGlobalFilters(new GraphQLExceptionsFilter());

    // Swagger setup
    const swaggerConfig = new DocumentBuilder()
      .setTitle('NestJS API')
      .setDescription('The NestJS API description')
      .setTermsOfService('http://example.com/terms-of-service')
      .setLicense('MIT License', 'http://example.com/license')
      .addServer('http://localhost:3000')
      .setVersion('1.0').build();
      
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, document);

    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    
    logger.log(`Application is running on: ${await app.getUrl()}`);
    logger.log(`GraphQL Playground: ${await app.getUrl()}/graphql`);
    logger.log(`Swagger API: ${await app.getUrl()}/api`);
    
  } catch (error) {
    logger.error('Failed to start application', error.stack);
    process.exit(1);
  }
}

void bootstrap();
// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { ValidationPipe, Logger } from '@nestjs/common';
// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import { GraphQLExceptionsFilter } from './common/filters/graphQLException.filter';
// import { NestExpressApplication } from '@nestjs/platform-express';
// import { join as pathJoin } from 'path';


// async function bootstrap() {
//   const logger = new Logger('Bootstrap');
  
//   try {
//     const app = await NestFactory.create<NestExpressApplication>(AppModule);
//     app.useStaticAssets(join(__dirname, '..', 'public'));

    
//     // Global error filter for GraphQL
//     app.useGlobalFilters(new GraphQLExceptionsFilter());
    
    
//     // Enhanced CORS configuration
//     app.enableCors({
//       origin: ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:5173'],
//       methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//       credentials: true,
//     });
    
//     // Enhanced validation pipe
//     app.useGlobalPipes(new ValidationPipe({
//       whitelist: true,
//       forbidNonWhitelisted: true,
//       transform: true,
//       transformOptions: {
//         enableImplicitConversion: true,
//       },
//       exceptionFactory: (errors) => {
//         const messages = errors.map(error => ({
//           field: error.property,
//           errors: Object.values(error.constraints || {}),
//         }));
//         return new Error(`Validation failed: ${JSON.stringify(messages)}`);
//       },
//     }));

//     // Swagger setup
//     const swaggerConfig = new DocumentBuilder()
//       .setTitle('NestJS API')
//       .setDescription('The NestJS API description')
//       .setTermsOfService('http://example.com/terms-of-service')
//       .setLicense('MIT License', 'http://example.com/license')
//       .addServer('http://localhost:3000')
//       .setVersion('1.0').build();
      
//     const document = SwaggerModule.createDocument(app, swaggerConfig);
//     SwaggerModule.setup('api', app, document);

//     const port = process.env.PORT ?? 3000;
//     await app.listen(port);
    
//     logger.log(`Application is running on: ${await app.getUrl()}`);
//     logger.log(`GraphQL Playground: ${await app.getUrl()}/graphql`);
//     logger.log(`Swagger API: ${await app.getUrl()}/api`);
    
//   } catch (error) {
//     logger.error('Failed to start application', error.stack);
//     process.exit(1);
//   }
// }

// void bootstrap();
// function join(__dirname: string, arg1: string, arg2: string): string {
//   return pathJoin(__dirname, arg1, arg2);
// }
// // import { AppModule } from './app.module';
// // import { ValidationPipe } from '@nestjs/common';
// // import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// // import { ConfigService } from '@nestjs/config';
// // import { GraphQLExceptionsFilter } from './common/filters/graphQLException.filter';

// // async function bootstrap() {
// //   const app = await NestFactory.create(AppModule);
// //   app.useGlobalFilters(new GraphQLExceptionsFilter());
  
// //   // Improved CORS configuration
// //   app.enableCors({
// //     origin: ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:5173'], // Add your frontend origin
// //     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
// //     credentials: true,
// //   });
  
// //   app.useGlobalPipes(new ValidationPipe({
// //     whitelist: true,
// //     forbidNonWhitelisted: true,
// //     transform: true,
// //     transformOptions: {
// //       enableImplicitConversion: true,
// //     },
// //   }));

// //   const swaggerConfig = new DocumentBuilder()
// //     .setTitle('NestJS API')
// //     .setDescription('The NestJS API description')
// //     .setTermsOfService('http://example.com/terms-of-service')
// //     .setLicense('MIT License', 'http://example.com/license')
// //     .addServer('http://localhost:3000')
// //     .setVersion('1.0').build();
    
// //   const document = SwaggerModule.createDocument(app, swaggerConfig);
// //   SwaggerModule.setup('api', app, document);


// //   // Add Global Interceptor
// //   // app.useGlobalInterceptors(new DataResponseInterceptor())
  


// //   await app.listen(process.env.PORT ?? 3000);
// //   console.log(`Application is running on: ${await app.getUrl()}`);
// // }
// // void bootstrap();
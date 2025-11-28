import "./polyfill"; 
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import { CustomLogger } from './admin/common/custom-logger.service';
import { EntityNotFoundFilter } from './admin/common/filter/entity-not-found.filter';
import { GraphQLExceptionsFilter } from './admin/common/filter/graphQLException.filter';
import { randomUUID } from 'crypto';

async function bootstrap() {
  const logger = new CustomLogger('Bootstrap');

  try {
    logger.log('🔄 Starting application bootstrap...');
    
    if (!(global as any).crypto) {
      (global as any).crypto = { randomUUID };
    }

    logger.log('📦 Creating NestJS application...');
    const app = await NestFactory.create(AppModule, {
      logger,
    });
    logger.log('✅ NestJS application created');

    app.useGlobalFilters(
      new EntityNotFoundFilter(),
      new GraphQLExceptionsFilter(),
    );

    app.use(cookieParser());

    app.enableCors({
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        'https://squl.co.ke',
        'https://squl.com',
        'https://www.squl.co.ke',
        /^https:\/\/.*\.squl\.com$/,
        /^https:\/\/.*\.squl\.co\.ke$/,
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true,
    });

    const expressApp = app.getHttpAdapter().getInstance() as express.Express;
    expressApp.set('trust proxy', true);

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        disableErrorMessages: false,
        exceptionFactory: (errors) => {
          const formattedErrors = errors.map((err) => ({
            field: err.property,
            errors: Object.values(err.constraints || {}),
          }));

          const error = new Error(
            'Validation failed: ' + JSON.stringify(formattedErrors),
          );
          error.name = 'ValidationError';
          throw error;
        },
      }),
    );

    app.use(
      '/favicon.ico',
      express.static(join(__dirname, '..', 'public', 'favicon.ico')),
    );

    const swaggerConfig = new DocumentBuilder()
      .setTitle('NestJS API')
      .setDescription('The NestJS API description')
      .setTermsOfService('http://example.com/terms-of-service')
      .setLicense('MIT License', 'http://example.com/license')
      .addServer('http://localhost:3000')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, document);

    // Use PORT from environment, default to 3000 to match healthcheck
    const port = process.env.PORT || 3000;

    logger.log(`🚀 Starting server on port ${port}...`);
    
    // Single listen call - bind to all interfaces for Docker
    // await app.listen(port, '0.0.0.0');
    await app.listen(3000, '0.0.0.0');


    const url = await app.getUrl();
    logger.log(`✅ Application is running on: ${url}`);
    logger.log(`📘 GraphQL Playground: ${url}/graphql`);
    logger.log(`📚 Swagger API docs: ${url}/api`);
    logger.log(`🏥 Health check available at: ${url}/health`);
    logger.log(`✨ Application startup complete!`);
  } catch (error) {
    logger.error('❌ Failed to start application', error.stack);
    process.exit(1);
  }
}

void bootstrap();

// import "./polyfill"; 
// import { ValidationPipe } from '@nestjs/common';
// import { NestFactory } from '@nestjs/core';
// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import * as cookieParser from 'cookie-parser';
// import * as express from 'express';
// import { join } from 'path';
// import { AppModule } from './app.module';
// import { CustomLogger } from './admin/common/custom-logger.service';
// import { EntityNotFoundFilter } from './admin/common/filter/entity-not-found.filter';
// import { GraphQLExceptionsFilter } from './admin/common/filter/graphQLException.filter';
// import { SeedingService } from './admin/school-type/seeds/school-type';
// import { randomUUID } from 'crypto';


// async function bootstrap() {
//   const logger = new CustomLogger('Bootstrap');

//   try {

//     if (!(global as any).crypto) {
//       (global as any).crypto = { randomUUID };
//     }
//     const app = await NestFactory.create(AppModule, {
//       logger,
//     });

//     app.useGlobalFilters(
//       new EntityNotFoundFilter(),
//       new GraphQLExceptionsFilter(),
//     );

//     app.use(cookieParser());

//     app.enableCors({
//       origin: [
//         'http://localhost:3000',
//         'http://localhost:3001',
//         'http://localhost:5173',
//         'https://squl.co.ke',
//         'https://squl.com',
//         'https://www.squl.co.ke',
//         /^https:\/\/.*\.squl\.com$/,
//         /^https:\/\/.*\.squl\.co\.ke$/,
//       ],
//       methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//       credentials: true,
//     });

//     const expressApp = app.getHttpAdapter().getInstance() as express.Express;
//     expressApp.set('trust proxy', true);

//     app.useGlobalPipes(
//       new ValidationPipe({
//         transform: true,
//         whitelist: true,
//         forbidNonWhitelisted: true,
//         disableErrorMessages: false,
//         exceptionFactory: (errors) => {
//           const formattedErrors = errors.map((err) => ({
//             field: err.property,
//             errors: Object.values(err.constraints || {}),
//           }));

//           const error = new Error(
//             'Validation failed: ' + JSON.stringify(formattedErrors),
//           );
//           error.name = 'ValidationError';
//           throw error;
//         },
//       }),
//     );

//     app.use(
//       '/favicon.ico',
//       express.static(join(__dirname, '..', 'public', 'favicon.ico')),
//     );

//     const swaggerConfig = new DocumentBuilder()
//       .setTitle('NestJS API')
//       .setDescription('The NestJS API description')
//       .setTermsOfService('http://example.com/terms-of-service')
//       .setLicense('MIT License', 'http://example.com/license')
//       .addServer('http://localhost:3000')
//       .setVersion('1.0')
//       .build();

//     const document = SwaggerModule.createDocument(app, swaggerConfig);
//     SwaggerModule.setup('api', app, document);

//     // Start application
//     const port = process.env.PORT || 4000;

//     //     const seedingService = app.get(SeedingService);
//     // await seedingService.seedAllSchoolTypes();
//     //  const seeder = app.get(SeedingService);
//     //  await seeder.seedAllSchoolTypes();

//     // app.enableCors({
//     //   origin: ['https://subdomain.squl.co.ke', 'http://localhost:3000'],
//     //   credentials: true, // ✅ allow cookies
//     // });
//     // const seeder = app.get(SeedingService);
//     // await seedingService.seedAllSchoolTypes();

//     // await app.listen(port, '0.0.0.0');
//     await app.listen(port || 3000, '0.0.0.0');

//     console.log('ENV TEST::::::g', port);

//     const url = await app.getUrl();
//     logger.log(`🚀 Application is running on: ${url}`);
//     logger.log(`📘 GraphQL Playground: ${url}/graphql`);
//     logger.log(`📚 Swagger API docs: ${url}/api`);
//   } catch (error) {
//     logger.error('❌ Failed to start application', error.stack);
//     process.exit(1);
//   }
// }

// void bootstrap();

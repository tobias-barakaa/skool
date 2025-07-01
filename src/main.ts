import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { EntityNotFoundFilter } from './common/filter/entity-not-found.filter';
import { GraphQLExceptionsFilter } from './common/filter/graphQLException.filter';
import { CustomLogger } from './common/custom-logger.service';
import * as express from 'express';
import { join } from 'path';
import { SeedingService } from './school-type/seeds/school-type';
import * as cookieParser from 'cookie-parser';




async function bootstrap() {
  const logger = new CustomLogger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, {
      logger,
    });

    // Global filters
    app.useGlobalFilters(
      new EntityNotFoundFilter(),
      new GraphQLExceptionsFilter(),
    );

    // CORS
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


    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        exceptionFactory: (errors) => {
          const formattedErrors = errors.map(err => ({
            field: err.property,
            errors: Object.values(err.constraints || {})
          }));
  
          const error = new Error('Validation failed: ' + JSON.stringify(formattedErrors));
          error.name = 'ValidationError';
          throw error;
        },
      }),
    );
  

    app.use('/favicon.ico', express.static(join(__dirname, '..', 'public', 'favicon.ico')));



    // Swagger setup
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

    // Start application
    const port = process.env.PORT || 4000

//     const seedingService = app.get(SeedingService);
// await seedingService.seedAllSchoolTypes();

    await app.listen(port, '0.0.0.0');
    console.log('ENV TEST::::::g', process.env.PORT);


    const url = await app.getUrl();
    logger.log(`🚀 Application is running on: ${url}`);
    logger.log(`📘 GraphQL Playground: ${url}/graphql`);
    logger.log(`📚 Swagger API docs: ${url}/api`);

  } catch (error) {
    logger.error('❌ Failed to start application', error.stack);
    process.exit(1);
  }
}


void bootstrap();

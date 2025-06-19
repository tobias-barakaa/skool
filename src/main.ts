import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { EntityNotFoundFilter } from './common/filter/entity-not-found.filter';
import { GraphQLExceptionsFilter } from './common/filter/graphQLException.filter';
import { CustomLogger } from './common/custom-logger.service';
import * as express from 'express';
import { join } from 'path';


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
    app.enableCors({
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        'https://squl.co.ke',
        'https://squl.com',
        'https://www.squl.co.ke',
        /^https:\/\/.*\.squl\.com$/ ,
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true,
    });

    // Validation Pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
        exceptionFactory: (errors) => {
          const messages = errors.map((error) => ({
            field: error.property,
            errors: Object.values(error.constraints || {}),
          }));
          return new Error(`Validation failed: ${JSON.stringify(messages)}`);
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
    const port = process.env.PORT || 3000
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

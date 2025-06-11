import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config'; // Make sure this is imported if used
import { Logger } from '@nestjs/common'; // <-- Import Logger
import { GqlAllExceptionsFilter } from './common/filters/gql-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new GqlAllExceptionsFilter());

  
  // Improved CORS configuration
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:5173'], // Add your frontend origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });
  
  // Apply global validation pipe for DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // Setup Swagger API documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('NestJS API')
    .setDescription('The NestJS API description')
    .setTermsOfService('http://example.com/terms-of-service')
    .setLicense('MIT License', 'http://example.com/license')
    .addServer('http://localhost:3000')
    .setVersion('1.0').build();
    
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  // --- IMPORTANT: Global process error handlers (last resort for server stability) ---
  // Catches unhandled promise rejections (e.g., async errors without .catch())
  process.on('unhandledRejection', (reason, promise) => {
    Logger.error('Unhandled Rejection at:', promise, 'reason:', reason, 'Bootstrap');
    // Depending on your deployment strategy, you might want to exit the process
    // after logging an unhandled rejection in production environments to ensure
    // the process manager (e.g., PM2, Kubernetes) restarts a fresh instance.
    // In development, you might just log to understand the issue.
    // process.exit(1); 
  });

  // Catches uncaught exceptions (synchronous errors not handled by try/catch)
  process.on('uncaughtException', (error) => {
    Logger.error('Uncaught Exception:', error.message, error.stack, 'Bootstrap');
    // For uncaught exceptions, it's generally recommended to exit and let a process manager restart
    // to prevent the application from being in an undefined state.
    // process.exit(1);
  });
  // --- End of global process error handlers ---


  await app.listen(process.env.PORT ?? 3000);
  Logger.log(`Application is running on: ${await app.getUrl()}`, 'Bootstrap'); // Use NestJS Logger
}
void bootstrap();

// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { ValidationPipe } from '@nestjs/common';
// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import { ConfigService } from '@nestjs/config';
// import { BusinessExceptionFilter } from './common/filters/business-exception.filter';
// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
  
//   // Improved CORS configuration
//   app.enableCors({
//     origin: ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:5173'], // Add your frontend origin
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
//     credentials: true,
//   });
  
//   app.useGlobalPipes(new ValidationPipe({
//     whitelist: true,
//     forbidNonWhitelisted: true,
//     transform: true,
//     transformOptions: {
//       enableImplicitConversion: true,
//     },
//   }));

//   const swaggerConfig = new DocumentBuilder()
//     .setTitle('NestJS API')
//     .setDescription('The NestJS API description')
//     .setTermsOfService('http://example.com/terms-of-service')
//     .setLicense('MIT License', 'http://example.com/license')
//     .addServer('http://localhost:3000')
//     .setVersion('1.0').build();
    
//   const document = SwaggerModule.createDocument(app, swaggerConfig);
//   SwaggerModule.setup('api', app, document);


//   // Add Global Interceptor
//   // app.useGlobalInterceptors(new DataResponseInterceptor())
  


//   await app.listen(process.env.PORT ?? 3000);
//   console.log(`Application is running on: ${await app.getUrl()}`);
// }
// void bootstrap();
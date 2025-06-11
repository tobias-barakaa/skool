import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { BusinessExceptionFilter } from './common/filters/business-exception.filter';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Improved CORS configuration
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:5173'], // Add your frontend origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NestJS API')
    .setDescription('The NestJS API description')
    .setTermsOfService('http://example.com/terms-of-service')
    .setLicense('MIT License', 'http://example.com/license')
    .addServer('http://localhost:3000')
    .setVersion('1.0').build();
    
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);


  // Add Global Interceptor
  // app.useGlobalInterceptors(new DataResponseInterceptor())
  app.useGlobalFilters(new BusinessExceptionFilter());


  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
void bootstrap();
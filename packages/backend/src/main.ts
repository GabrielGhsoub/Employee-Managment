// src/main.ts

import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const logger = app.get(Logger);
  app.useLogger(logger);

  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost, logger));

  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Employee Directory API')
    .setDescription(
      'A comprehensive API for managing the company\'s employee directory. \n\nThis API provides endpoints for creating, reading, updating, and deleting employee records. It also supports advanced features like pagination, filtering, and searching.',
    )
    .setVersion('1.0')
    .setContact(
      'API Support',
      'https://gabrielghsoub.com',
      'ghoussoubgabriel@gmail.com',
    )
    .setLicense(
      'Apache 2.0',
      'https://www.apache.org/licenses/LICENSE-2.0.html',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
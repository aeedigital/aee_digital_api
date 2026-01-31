import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as packageInfo from '../package.json';
import { WinstonLogger } from './services/logger.service';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/HttpExceptionFilter';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express } from 'express';

// Shared bootstrap used both for HTTP server and Lambda handler
export async function createApp(expressInstance?: Express) {
  const adapter = expressInstance
    ? new ExpressAdapter(expressInstance)
    : undefined;

  const app = await NestFactory.create(AppModule, adapter, {
    logger: new WinstonLogger(),
    cors: true
  });

  const allowedOrigins = new Set([
    'http://162.214.123.133:4200',
    'http://162.214.123.133:3000',
    'https://d2enljusu1yyvy.cloudfront.net', // domínio correto
  ]);

  app.enableCors({
    origin: (origin, callback) => {
      // curl, Postman e chamadas internas não possuem Origin
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      // Não lança erro (evita 500) — apenas bloqueia o CORS
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle(packageInfo.name)
    .setDescription(packageInfo.description)
    .setVersion(packageInfo.version)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // For Lambda we do not call listen here; caller decides (HTTP server or adapter)
  return app;
}

// Convenience helper for local/manual bootstrapping
export async function bootstrapHttp(port: number | string) {
  const app = await createApp();
  await app.listen(port);
  return app;
}

// Small factory to create an express instance when we need it (Lambda)
export function createExpressApp() {
  return express();
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonLogger } from './services/logger.service';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/HttpExceptionFilter';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { parse as parseUrlEncoded } from 'fast-querystring';

// Shared bootstrap used both for HTTP server and Lambda handler
export async function createApp(): Promise<NestFastifyApplication> {
  const adapter = new FastifyAdapter();

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    logger: new WinstonLogger(),
    // Explicitly manage CORS to control allowed origins; do not auto-enable
    cors: false,
  });

  // Permite requisições com Content-Type application/json e body vazio (ex.: DELETE sem payload)
  const adapterInstance = app.getHttpAdapter() as FastifyAdapter;
  const fastify = adapterInstance.getInstance();
  // Substitui parser JSON padrão para aceitar corpo vazio; remove o existente antes de registrar
  fastify.removeContentTypeParser('application/json');
  adapterInstance.useBodyParser(
    'application/json',
    false,
    undefined,
    (_req, body: Buffer, done) => {
      try {
        const payload = body && body.length > 0 ? body.toString() : '';
        const json = payload.trim().length > 0 ? JSON.parse(payload) : {};
        done(null, json);
      } catch (err) {
        done(err as Error, undefined);
      }
    },
  );

  // Como marcamos o parser como registrado, precisamos garantir parser urlencoded manualmente
  const bodyLimit = (fastify as any).initialConfig?.bodyLimit;
  fastify.addContentTypeParser(
    'application/x-www-form-urlencoded',
    { parseAs: 'buffer', bodyLimit },
    (_req, body: Buffer, done) => {
      try {
        const parsed = parseUrlEncoded(body?.toString() ?? '');
        done(null, parsed);
      } catch (err) {
        done(err as Error, undefined);
      }
    },
  );

  // CORS totalmente liberado temporariamente
  const allowAllCors = true;

  app.enableCors({
    origin: allowAllCors ? true : false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());

  // For Lambda we do not call listen here; caller decides (HTTP server or adapter)
  return app;
}

// Convenience helper for local/manual bootstrapping
export async function bootstrapHttp(port: number | string): Promise<NestFastifyApplication> {
  const app = await createApp();
  await app.listen(port, '0.0.0.0');
  return app;
}

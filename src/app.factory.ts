import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonLogger } from './services/logger.service';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/HttpExceptionFilter';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

// Shared bootstrap used both for HTTP server and Lambda handler
export async function createApp(): Promise<NestFastifyApplication> {
  const adapter = new FastifyAdapter();

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    logger: new WinstonLogger(),
    // Explicitly manage CORS to control allowed origins; do not auto-enable
    cors: false,
  });

  // Permite requisições com Content-Type application/json e body vazio (ex.: DELETE sem payload)
  const fastify = app.getHttpAdapter().getInstance();
  fastify.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (req, body: string, done) => {
      try {
        const json =
          body && body.trim().length > 0
            ? JSON.parse(body)
            : {};
        done(null, json);
      } catch (err) {
        done(err as Error, undefined);
      }
    },
  );

  const allowedOrigins = new Set([
    'http://162.214.123.133:4200',
    'http://162.214.123.133:3000',
    'http://localhost:3000',
    'https://d2enljusu1yyvy.cloudfront.net', // domínio antigo
    'https://www.aliancadigital.org.br',     // front em produção
    'https://aliancadigital.org.br',         // domínio sem www
    ...(process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
      : []),
  ]);

  app.enableCors({
    origin: (origin, callback) => {
      // curl, Postman e chamadas internas não possuem Origin
      if (!origin) {
        return callback(null, true);
      }

      // Permite chamadas vindas diretamente do domínio do API Gateway (execute-api)
      try {
        const url = new URL(origin);
        if (url.hostname.includes('execute-api')) {
          return callback(null, true);
        }
      } catch (_) {
        // se não for URL válida, segue fluxo normal
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

  // For Lambda we do not call listen here; caller decides (HTTP server or adapter)
  return app;
}

// Convenience helper for local/manual bootstrapping
export async function bootstrapHttp(port: number | string): Promise<NestFastifyApplication> {
  const app = await createApp();
  await app.listen(port, '0.0.0.0');
  return app;
}

import { Handler, Context, Callback } from 'aws-lambda';
import awsLambdaFastify from '@fastify/aws-lambda';
import { createApp } from './app.factory';
import { FastifyInstance } from 'fastify';

let cachedHandler: ReturnType<typeof awsLambdaFastify>;

export const handler: Handler = async (event: any, context: Context, callback: Callback) => {
  // evita manter event loop ativo e reduzir tempo de finalização em cold start
  context.callbackWaitsForEmptyEventLoop = false;

  if (!cachedHandler) {
    const nestApp = await createApp();
    await nestApp.init();
    // Cast avoids type mismatch between fastify types bundled with Nest and root fastify
    const fastifyInstance = nestApp.getHttpAdapter().getInstance() as unknown as FastifyInstance;
    cachedHandler = awsLambdaFastify(fastifyInstance);
  }

  return cachedHandler(event, context, callback);
};

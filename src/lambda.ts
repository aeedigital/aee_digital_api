import { Handler, Context, Callback } from 'aws-lambda';
import serverlessExpress from '@vendia/serverless-express';
import { createApp, createExpressApp } from './app.factory';

let cachedServer: Handler;

export const handler: Handler = async (event: any, context: Context, callback: Callback) => {
  if (!cachedServer) {
    const expressApp = createExpressApp();
    const nestApp = await createApp(expressApp);
    await nestApp.init();
    cachedServer = serverlessExpress({ app: expressApp });
  }

  return cachedServer(event, context, callback);
};

import { bootstrapHttp } from './app.factory';

async function bootstrap() {
  const port = process.env.PORT || 5001;
  await bootstrapHttp(port);
}

bootstrap();

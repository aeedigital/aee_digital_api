import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as packageInfo from '../package.json';
import { WinstonLogger } from './services/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule,{
    logger: new WinstonLogger(),
  });

  const config = new DocumentBuilder()
    .setTitle(packageInfo.name)
    .setDescription(packageInfo.description)
    .setVersion(packageInfo.version)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  const port = process.env.PORT || 5000;
  await app.listen(port);
}
bootstrap();

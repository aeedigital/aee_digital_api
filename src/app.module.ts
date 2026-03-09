import { ManagementModule } from './management/management.module';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CentrosModule } from './centros/centros.module';
import { RegionaisModule } from './regionais/regionais.module';
import { FormsModule } from './forms/forms.module';
import { QuestionsModule } from './questions/questions.module';
import { AnswersModule } from './answers/answers.module';
import { PassesModule } from './passes/passes.module';
import { PessoasModule } from './pessoas/pessoas.module';
import { SummaryModule } from './summary/summary.module';
import { CadastroInfoModule } from './cadastro-info/cadastro-info.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { WinstonLogger } from './services/logger.service';
import { ReqnameMiddleware } from './base/reqname.middleware';
import { MongooseModule } from '@nestjs/mongoose';
import { isMemoryDriver } from './infra/persistence/persistence.config';

const DEFAULT_MONGODB_URI =
  'mongodb+srv://aliancadigital:aliancadigital@aee.pvgzm2s.mongodb.net/';

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ManagementModule,
    CacheModule.register({
      isGlobal: true,
    }),
    ...(isMemoryDriver()
      ? []
      : [
          MongooseModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
              uri: configService.get<string>('MONGODB_URI')?.trim() || DEFAULT_MONGODB_URI,
              retryReads: true,
              retryWrites: true,
              family: 4,
              appName: 'aee_digital_api',
              minPoolSize: 0,
              maxPoolSize: parsePositiveInt(
                configService.get<string>('MONGODB_MAX_POOL_SIZE'),
                10,
              ),
              maxIdleTimeMS: parsePositiveInt(
                configService.get<string>('MONGODB_MAX_IDLE_TIME_MS'),
                30000,
              ),
              connectTimeoutMS: parsePositiveInt(
                configService.get<string>('MONGODB_CONNECT_TIMEOUT_MS'),
                10000,
              ),
              socketTimeoutMS: parsePositiveInt(
                configService.get<string>('MONGODB_SOCKET_TIMEOUT_MS'),
                45000,
              ),
              serverSelectionTimeoutMS: parsePositiveInt(
                configService.get<string>('MONGODB_SERVER_SELECTION_TIMEOUT_MS'),
                5000,
              ),
            }),
          }),
        ]),
    CentrosModule,
    RegionaisModule,
    FormsModule,
    QuestionsModule,
    AnswersModule,
    PassesModule,
    PessoasModule,
    SummaryModule,
    CadastroInfoModule,
  ],
  controllers: [AppController],
  providers: [AppService, WinstonLogger],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ReqnameMiddleware).forRoutes('*');
  }
}

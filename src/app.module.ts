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
import { createMongooseConnectionOptions } from './infra/persistence/mongoose.options';

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
            useFactory: createMongooseConnectionOptions,
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

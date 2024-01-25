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

import { CacheModule } from '@nestjs/cache-manager';

import { ReqnameMiddleware } from './base/reqname.middleware';

import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ManagementModule,
    CacheModule.register(),
    MongooseModule.forRoot(
      'mongodb+srv://aliancadigital:aliancadigital@aee.pvgzm2s.mongodb.net/',
    ),
    CentrosModule,
    RegionaisModule,
    FormsModule,
    QuestionsModule,
    AnswersModule,
    PassesModule,
    PessoasModule,
    SummaryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ReqnameMiddleware).forRoutes('*');
  }
}

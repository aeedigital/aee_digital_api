import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CentrosModule } from './centros/centros.module';
import { RegionaisModule } from './regionais/regionais.module';
import { FormsModule } from './forms/forms.module';
import { QuestionsModule } from './questions/questions.module';
import { PassesModule } from './passes/passes.module';
import { PessoasModule } from './pessoas/pessoas.module';

import { ReqnameMiddleware } from './base/reqname.middleware';

import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://aliancadigital:aliancadigital@aee.pvgzm2s.mongodb.net/',
    ),
    CentrosModule,
    RegionaisModule,
    FormsModule,
    QuestionsModule,
    PassesModule,
    PessoasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ReqnameMiddleware).forRoutes('*');
  }
}

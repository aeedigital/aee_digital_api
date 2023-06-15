import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CentrosModule } from './centros/centros.module';
import { RegionaisModule } from './regionais/regionais.module';
import { MongooseModule } from '@nestjs/mongoose';


@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://aliancadigital:aliancadigital@aee.pvgzm2s.mongodb.net/',
    ),
    CentrosModule,
    RegionaisModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

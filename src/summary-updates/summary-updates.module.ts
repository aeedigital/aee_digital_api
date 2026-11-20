import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GeocodingService, GeoapifyGeocodingProvider, GEOCODING_PROVIDER } from '../application/centros/geocoding.service';
import { SummaryCentroRefreshService } from '../application/summary/summary-centro-refresh.service';
import { PersistenceModule } from '../infra/persistence/persistence.module';
import { createMongooseConnectionOptions } from '../infra/persistence/mongoose.options';
import { isMemoryDriver } from '../infra/persistence/persistence.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ...(isMemoryDriver()
      ? []
      : [
          MongooseModule.forRootAsync({
            inject: [ConfigService],
            useFactory: createMongooseConnectionOptions,
          }),
        ]),
    PersistenceModule.forRoot(),
  ],
  providers: [
    {
      provide: GEOCODING_PROVIDER,
      useClass: GeoapifyGeocodingProvider,
    },
    GeocodingService,
    SummaryCentroRefreshService,
  ],
  exports: [SummaryCentroRefreshService],
})
export class SummaryUpdatesModule {}

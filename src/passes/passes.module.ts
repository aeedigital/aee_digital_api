import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheService } from '../services/cache.service';
import { PassesController } from './passes.controller';
import { PassesSchema } from './schemas/passes.schema';
import { PassesMongoRepository } from '../infra/mongo/passes.mongo.repository';
import { PASS_REPOSITORY } from './passes.tokens';
import { PassesAppService } from '../application/passes/passes.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Passes', schema: PassesSchema }]),
  ],

  controllers: [PassesController],
  providers: [
    PassesAppService,
    CacheService,
    {
      provide: PASS_REPOSITORY,
      useClass: PassesMongoRepository,
    },
  ],
})
export class PassesModule {}

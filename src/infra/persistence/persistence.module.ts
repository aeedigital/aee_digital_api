import { DynamicModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { isMemoryDriver } from './persistence.config';
import { ANSWER_REPOSITORY, CENTRO_REPOSITORY, FORM_REPOSITORY, PASS_REPOSITORY, PERSON_REPOSITORY, QUESTION_REPOSITORY, REGIONAL_REPOSITORY, SUMMARY_REPOSITORY } from '../../domain/repositories/repository.tokens';
import { AnswersMongoRepository } from '../mongo/answers.mongo.repository';
import { AnswersMemoryRepository } from '../memory/answers.memory.repository';
import { CentrosMongoRepository } from '../mongo/centros.mongo.repository';
import { CentrosMemoryRepository } from '../memory/centros.memory.repository';
import { FormsMongoRepository } from '../mongo/forms.mongo.repository';
import { FormsMemoryRepository } from '../memory/forms.memory.repository';
import { PassesMongoRepository } from '../mongo/passes.mongo.repository';
import { PassesMemoryRepository } from '../memory/passes.memory.repository';
import { PessoasMongoRepository } from '../mongo/pessoas.mongo.repository';
import { PessoasMemoryRepository } from '../memory/pessoas.memory.repository';
import { QuestionsMongoRepository } from '../mongo/questions.mongo.repository';
import { QuestionsMemoryRepository } from '../memory/questions.memory.repository';
import { RegionaisMongoRepository } from '../mongo/regionais.mongo.repository';
import { RegionaisMemoryRepository } from '../memory/regionais.memory.repository';
import { SummariesMongoRepository } from '../mongo/summaries.mongo.repository';
import { SummariesMemoryRepository } from '../memory/summaries.memory.repository';
import { CacheService } from '../../services/cache.service';
import { AnswersSchema } from '../../answers/schemas/answers.schema';
import { Centro, CentroSchema } from '../../centros/schemas/centro.schema';
import { Forms, FormSchema } from '../../forms/schemas/forms.schema';
import { PassesSchema } from '../../passes/schemas/passes.schema';
import { PessoasSchema } from '../../pessoas/schemas/pessoas.schema';
import { QuestionsSchema } from '../../questions/schemas/questions.schema';
import { RegionalSchema } from '../../regionais/schemas/regionais.schema';
import { Summaries, SummariesSchema } from '../../summary/schemas/summaries.schema';

const repositoryProvider = (token: symbol, mongoToken: any, memoryToken: any) => ({
  provide: token,
  useFactory: (mongoRepo: any, memoryRepo: any) =>
    isMemoryDriver() ? memoryRepo : mongoRepo,
  inject: [mongoToken, memoryToken],
});

@Module({})
export class PersistenceModule {
  static forRoot(): DynamicModule {
    const useMemory = isMemoryDriver();
    const imports = useMemory
      ? [CacheModule.register()]
      : [
        CacheModule.register(),
        MongooseModule.forFeature([
          { name: 'Answers', schema: AnswersSchema },
          { name: Centro.name, schema: CentroSchema },
          { name: Forms.name, schema: FormSchema },
          { name: 'Passes', schema: PassesSchema },
          { name: 'Pessoas', schema: PessoasSchema },
          { name: 'Questions', schema: QuestionsSchema },
          { name: 'Regional', schema: RegionalSchema },
          { name: Summaries.name, schema: SummariesSchema },
        ]),
      ];

    const providers = [
      CacheService,
      AnswersMongoRepository,
      AnswersMemoryRepository,
      repositoryProvider(ANSWER_REPOSITORY, AnswersMongoRepository, AnswersMemoryRepository),
      CentrosMongoRepository,
      CentrosMemoryRepository,
      repositoryProvider(CENTRO_REPOSITORY, CentrosMongoRepository, CentrosMemoryRepository),
      FormsMongoRepository,
      FormsMemoryRepository,
      repositoryProvider(FORM_REPOSITORY, FormsMongoRepository, FormsMemoryRepository),
      PassesMongoRepository,
      PassesMemoryRepository,
      repositoryProvider(PASS_REPOSITORY, PassesMongoRepository, PassesMemoryRepository),
      PessoasMongoRepository,
      PessoasMemoryRepository,
      repositoryProvider(PERSON_REPOSITORY, PessoasMongoRepository, PessoasMemoryRepository),
      QuestionsMongoRepository,
      QuestionsMemoryRepository,
      repositoryProvider(QUESTION_REPOSITORY, QuestionsMongoRepository, QuestionsMemoryRepository),
      RegionaisMongoRepository,
      RegionaisMemoryRepository,
      repositoryProvider(REGIONAL_REPOSITORY, RegionaisMongoRepository, RegionaisMemoryRepository),
      SummariesMongoRepository,
      SummariesMemoryRepository,
      repositoryProvider(SUMMARY_REPOSITORY, SummariesMongoRepository, SummariesMemoryRepository),
    ];

    return {
      module: PersistenceModule,
      imports,
      providers,
      exports: [
        CacheService,
        ANSWER_REPOSITORY,
        CENTRO_REPOSITORY,
        FORM_REPOSITORY,
        PASS_REPOSITORY,
        PERSON_REPOSITORY,
        QUESTION_REPOSITORY,
        REGIONAL_REPOSITORY,
        SUMMARY_REPOSITORY,
      ],
    };
  }
}

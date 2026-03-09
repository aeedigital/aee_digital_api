import { DynamicModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { isMemoryDriver } from './persistence.config';
import {
  ANSWER_REPOSITORY,
  CADASTRO_INFO_REPOSITORY,
  CENTRO_REPOSITORY,
  FORM_REPOSITORY,
  PASS_REPOSITORY,
  PERSON_REPOSITORY,
  QUESTION_REPOSITORY,
  REGIONAL_REPOSITORY,
  SUMMARY_REPOSITORY,
} from '../../domain/repositories/repository.tokens';
import { AnswersMongoRepository } from '../mongo/answers.mongo.repository';
import { AnswersMemoryRepository } from '../memory/answers.memory.repository';
import { CadastroInfoMongoRepository } from '../mongo/cadastro-info.mongo.repository';
import { CadastroInfoMemoryRepository } from '../memory/cadastro-info.memory.repository';
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
import {
  CadastroInfoSchema,
  CadastroInfoSchemaClass,
} from '../../cadastro-info/schemas/cadastro-info.schema';

const repositoryProvider = (token: symbol, repositoryToken: any) => ({
  provide: token,
  useExisting: repositoryToken,
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
          { name: CadastroInfoSchemaClass.name, schema: CadastroInfoSchema },
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
      ...(useMemory
        ? [
            AnswersMemoryRepository,
            repositoryProvider(ANSWER_REPOSITORY, AnswersMemoryRepository),
            CadastroInfoMemoryRepository,
            repositoryProvider(CADASTRO_INFO_REPOSITORY, CadastroInfoMemoryRepository),
            CentrosMemoryRepository,
            repositoryProvider(CENTRO_REPOSITORY, CentrosMemoryRepository),
            FormsMemoryRepository,
            repositoryProvider(FORM_REPOSITORY, FormsMemoryRepository),
            PassesMemoryRepository,
            repositoryProvider(PASS_REPOSITORY, PassesMemoryRepository),
            PessoasMemoryRepository,
            repositoryProvider(PERSON_REPOSITORY, PessoasMemoryRepository),
            QuestionsMemoryRepository,
            repositoryProvider(QUESTION_REPOSITORY, QuestionsMemoryRepository),
            RegionaisMemoryRepository,
            repositoryProvider(REGIONAL_REPOSITORY, RegionaisMemoryRepository),
            SummariesMemoryRepository,
            repositoryProvider(SUMMARY_REPOSITORY, SummariesMemoryRepository),
          ]
        : [
            AnswersMongoRepository,
            repositoryProvider(ANSWER_REPOSITORY, AnswersMongoRepository),
            CadastroInfoMongoRepository,
            repositoryProvider(CADASTRO_INFO_REPOSITORY, CadastroInfoMongoRepository),
            CentrosMongoRepository,
            repositoryProvider(CENTRO_REPOSITORY, CentrosMongoRepository),
            FormsMongoRepository,
            repositoryProvider(FORM_REPOSITORY, FormsMongoRepository),
            PassesMongoRepository,
            repositoryProvider(PASS_REPOSITORY, PassesMongoRepository),
            PessoasMongoRepository,
            repositoryProvider(PERSON_REPOSITORY, PessoasMongoRepository),
            QuestionsMongoRepository,
            repositoryProvider(QUESTION_REPOSITORY, QuestionsMongoRepository),
            RegionaisMongoRepository,
            repositoryProvider(REGIONAL_REPOSITORY, RegionaisMongoRepository),
            SummariesMongoRepository,
            repositoryProvider(SUMMARY_REPOSITORY, SummariesMongoRepository),
          ]),
    ];

    return {
      module: PersistenceModule,
      imports,
      providers,
      exports: [
        CacheService,
        ANSWER_REPOSITORY,
        CADASTRO_INFO_REPOSITORY,
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

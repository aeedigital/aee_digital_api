import { Module } from '@nestjs/common';
import { CacheService } from '../services/cache.service';

import { RegionaisController } from './regionais.controller';

import { CentrosModule } from '../centros/centros.module';
import { SummaryModule } from '../summary/summary.module';
import { PessoasModule } from '../pessoas/pessoas.module';
import { FormsModule } from '../forms/forms.module';
import { AnswersModule } from '../answers/answers.module';
import { REGIONAL_REPOSITORY } from '../domain/repositories/repository.tokens';
import { RegionaisAppService } from '../application/regionais/regionais.service';
import { PersistenceModule } from '../infra/persistence/persistence.module';
import { DashboardProjectionsModule } from '../dashboard-projections/dashboard-projections.module';
import { CadastroInfoModule } from '../cadastro-info/cadastro-info.module';

@Module({
  imports: [
    CentrosModule,
    SummaryModule,
    PessoasModule,
    FormsModule,
    AnswersModule,
    PersistenceModule.forRoot(),
    DashboardProjectionsModule,
    CadastroInfoModule,
  ],

  controllers: [RegionaisController],
  providers: [
    RegionaisAppService,
    CacheService,
    // repository provided by PersistenceModule
  ],
})
export class RegionaisModule {}

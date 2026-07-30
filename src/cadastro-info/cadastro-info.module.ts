import { Module } from '@nestjs/common';
import { CadastroInfoController } from './cadastro-info.controller';
import { CadastroInfoAppService } from '../application/cadastro-info/cadastro-info.service';
import { PersistenceModule } from '../infra/persistence/persistence.module';
import { FormsModule } from '../forms/forms.module';

@Module({
  imports: [PersistenceModule.forRoot(), FormsModule],
  controllers: [CadastroInfoController],
  providers: [CadastroInfoAppService],
  exports: [CadastroInfoAppService],
})
export class CadastroInfoModule {}

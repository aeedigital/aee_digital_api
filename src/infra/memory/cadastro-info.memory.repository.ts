import { Injectable } from '@nestjs/common';
import { BaseMemoryRepository } from './base.memory.repository';
import { CadastroInfo } from '../../domain/entities/cadastro-info';
import {
  CadastroInfoFilter,
  CadastroInfoRepository,
  CreateCadastroInfoInput,
  UpdateCadastroInfoInput,
} from '../../domain/repositories/cadastro-info.repository';

@Injectable()
export class CadastroInfoMemoryRepository
  extends BaseMemoryRepository<
    CadastroInfo,
    CreateCadastroInfoInput,
    UpdateCadastroInfoInput,
    CadastroInfoFilter
  >
  implements CadastroInfoRepository
{
  async findActive(): Promise<CadastroInfo | null> {
    const items = await this.findAll({ isActive: true });
    if (!items.length) {
      return null;
    }
    return items.at(-1) || null;
  }
}

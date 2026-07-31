import { ConflictException, Injectable } from '@nestjs/common';
import { Centro, CentroLocation } from '../../domain/entities/centro';
import {
  CentroAddress,
  CentroFilter,
  CentroRepository,
  CreateCentroInput,
  UpdateCentroInput,
} from '../../domain/repositories/centro.repository';
import { BaseMemoryRepository } from './base.memory.repository';

@Injectable()
export class CentrosMemoryRepository
  extends BaseMemoryRepository<Centro, CreateCentroInput, UpdateCentroInput, CentroFilter>
  implements CentroRepository
{
  async saveLocation(
    id: string,
    expectedAddress: CentroAddress,
    location: CentroLocation,
  ): Promise<Centro> {
    const current = await this.findById(id);
    const addressMatches =
      current &&
      Object.entries(expectedAddress).every(
        ([field, value]) => (current as any)[field] === value,
      );
    if (!current || !addressMatches) {
      throw new ConflictException(
        'O centro não existe ou seu endereço foi alterado durante a atualização',
      );
    }
    return this.update(id, { location });
  }
}

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Centro,
  CentroLocation,
  SummarySourceVersion,
} from '../../domain/entities/centro';
import {
  CentroAddress,
  CentroFilter,
  CentroRepository,
  CentroSummaryProfile,
  CreateCentroInput,
  isSummarySourceVersionNewer,
  UpdateCentroInput,
} from '../../domain/repositories/centro.repository';
import { BaseMemoryRepository } from './base.memory.repository';

@Injectable()
export class CentrosMemoryRepository
  extends BaseMemoryRepository<Centro, CreateCentroInput, UpdateCentroInput, CentroFilter>
  implements CentroRepository
{
  async applySummaryProfileIfNewer(
    id: string,
    sourceVersion: SummarySourceVersion,
    profile: CentroSummaryProfile,
  ): Promise<boolean> {
    const current = await this.findById(id);
    if (!current) {
      throw new NotFoundException('Centro not found');
    }
    if (
      !isSummarySourceVersionNewer(
        sourceVersion,
        current.summarySourceVersion,
      )
    ) {
      return false;
    }

    const { telefone, site, ...fields } = profile;
    const updated = await this.update(id, {
      ...fields,
      ...(telefone === null || telefone === undefined ? {} : { telefone }),
      ...(site === null || site === undefined ? {} : { site }),
    } as UpdateCentroInput);
    if (telefone === null) delete updated.telefone;
    if (site === null) delete updated.site;

    const versioned = { ...updated, summarySourceVersion: sourceVersion };
    this.store.set(id, versioned);
    return true;
  }

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

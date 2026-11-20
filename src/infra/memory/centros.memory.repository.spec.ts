import { ConflictException } from '@nestjs/common';
import {
  CentroSummaryProfile,
} from '../../domain/repositories/centro.repository';
import { SummarySourceVersion } from '../../domain/entities/centro';
import { CentrosMemoryRepository } from './centros.memory.repository';

type SummaryProfileApplier = {
  applySummaryProfileIfNewer(
    id: string,
    version: SummarySourceVersion,
    profile: CentroSummaryProfile,
  ): Promise<boolean>;
};

describe('CentrosMemoryRepository location', () => {
  const input = {
    funcionamento: {} as any,
    nomeCentro: 'Centro',
    nomeCurto: 'C',
    cnpjCentro: '123',
    dataFundacao: '2020-01-01',
    regional: 'r1',
    endereco: 'Rua 1',
    cep: '000',
    bairro: 'B',
    cidade: 'C',
    estado: 'E',
    pais: 'BR',
  };

  it('saves location only for the expected address', async () => {
    const repository = new CentrosMemoryRepository();
    const centro = await repository.create(input);
    const updated = await repository.saveLocation(
      centro.id,
      input,
      {
        status: 'CONFIRMADA',
        latitude: -23,
        longitude: -46,
        addressHash: 'hash',
      },
    );
    expect(updated.location).toEqual(
      expect.objectContaining({ latitude: -23, longitude: -46 }),
    );
  });

  it('rejects a result for a different address', async () => {
    const repository = new CentrosMemoryRepository();
    const centro = await repository.create(input);
    await expect(
      repository.saveLocation(
        centro.id,
        { ...input, endereco: 'Rua antiga' },
        { status: 'ERRO', addressHash: 'hash' },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('applies only summary versions newer than the stored version', async () => {
    const repository = new CentrosMemoryRepository();
    const centro = await repository.create(input);
    const applyProfile = (
      repository as unknown as SummaryProfileApplier
    ).applySummaryProfileIfNewer.bind(repository);
    const newest: SummarySourceVersion = {
      updatedAt: new Date('2026-03-02T10:00:00.000Z'),
      createdAt: new Date('2026-03-01T10:00:00.000Z'),
      summaryId: 's2',
    };
    const profile: CentroSummaryProfile = {
      endereco: 'Rua nova',
      telefone: '111',
    };

    await expect(applyProfile(centro.id, newest, profile)).resolves.toBe(true);
    await expect(applyProfile(centro.id, newest, { telefone: '222' })).resolves.toBe(
      false,
    );
    await expect(
      applyProfile(
        centro.id,
        {
          ...newest,
          updatedAt: new Date('2026-03-01T10:00:00.000Z'),
        },
        { endereco: 'Rua antiga' },
      ),
    ).resolves.toBe(false);
    await expect(repository.findById(centro.id)).resolves.toEqual(
      expect.objectContaining({
        endereco: 'Rua nova',
        telefone: '111',
        summarySourceVersion: newest,
      }),
    );
  });
});

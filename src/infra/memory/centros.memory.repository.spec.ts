import { ConflictException } from '@nestjs/common';
import { CentrosMemoryRepository } from './centros.memory.repository';

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
});

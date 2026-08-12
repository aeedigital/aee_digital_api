import { Centro } from '../domain/entities/centro';
import { toCentroResponse } from './centro.presenter';

const centro = {
  id: 'c1',
  location: {
    latitude: -23.5475,
    longitude: -46.6344,
    status: 'CONFIRMADA',
    precision: 'BUILDING',
    confidence: 0.98,
    addressHash: 'internal-hash',
    errorCode: 'internal-error',
    updatedAt: new Date('2026-07-30T10:00:00.000Z'),
  },
} as Centro;

describe('toCentroResponse', () => {
  it('exposes coordinates without internal location fields', () => {
    const response = toCentroResponse(centro);
    expect(response.LOCALIZACAO).toEqual({
      LATITUDE: -23.5475,
      LONGITUDE: -46.6344,
      STATUS: 'CONFIRMADA',
      PRECISAO: 'BUILDING',
      CONFIANCA: 0.98,
      ATUALIZADA_EM: '2026-07-30T10:00:00.000Z',
    });
    expect((response.LOCALIZACAO as any).addressHash).toBeUndefined();
    expect((response.LOCALIZACAO as any).errorCode).toBeUndefined();
  });

  it('returns pending location for legacy centros', () => {
    expect(toCentroResponse({ id: 'legacy' } as Centro).LOCALIZACAO).toEqual({
      LATITUDE: null,
      LONGITUDE: null,
      STATUS: 'PENDENTE',
    });
  });
});

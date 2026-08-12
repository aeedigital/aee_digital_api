import { CentroSchema } from './centro.schema';

describe('CentroSchema location', () => {
  it('defines a partial 2dsphere index for persisted points', () => {
    expect(CentroSchema.indexes()).toContainEqual([
      { 'LOCALIZACAO.PONTO': '2dsphere' },
      {
        partialFilterExpression: {
          'LOCALIZACAO.PONTO.type': 'Point',
        },
        background: true,
      },
    ]);
  });

  it('does not select internal coherence and error fields by default', () => {
    expect(CentroSchema.path('LOCALIZACAO.ENDERECO_HASH').options.select).toBe(false);
    expect(CentroSchema.path('LOCALIZACAO.ERRO_CODIGO').options.select).toBe(false);
  });
});

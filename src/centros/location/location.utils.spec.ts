import {
  hashAddress,
  hasSufficientAddress,
  isValidCoordinate,
} from './location.utils';
import { CentroAddress } from './location.types';

describe('location utils', () => {
  const address: CentroAddress = {
    ENDERECO: 'Rua São Bento, 10',
    CEP: '01011-000',
    BAIRRO: 'Centro',
    CIDADE: 'São Paulo',
    ESTADO: 'SP',
    PAIS: 'BR',
  };

  it('creates the same hash for equivalent formatting', () => {
    expect(
      hashAddress({
        ...address,
        ENDERECO: ' rua sao bento, 10 ',
        CIDADE: 'SAO   PAULO',
      }),
    ).toBe(hashAddress(address));
  });

  it('requires street, city and country', () => {
    expect(hasSufficientAddress(address)).toBe(true);
    expect(
      hasSufficientAddress({ ...address, ENDERECO: '(sem endereço)' }),
    ).toBe(false);
    expect(hasSufficientAddress({ ...address, CIDADE: '  ' })).toBe(false);
  });

  it('validates coordinate ranges', () => {
    expect(isValidCoordinate(-90, -180)).toBe(true);
    expect(isValidCoordinate(90, 180)).toBe(true);
    expect(isValidCoordinate(90.1, 0)).toBe(false);
    expect(isValidCoordinate(0, -180.1)).toBe(false);
    expect(isValidCoordinate(Number.NaN, 0)).toBe(false);
  });
});

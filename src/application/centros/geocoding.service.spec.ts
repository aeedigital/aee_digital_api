import { ConflictException } from '@nestjs/common';
import { Centro } from '../../domain/entities/centro';
import { CentroRepository } from '../../domain/repositories/centro.repository';
import { GeocodingService } from './geocoding.service';

const centro: Centro = {
  id: 'c1',
  nomeCentro: 'Centro',
  nomeCurto: 'C',
  cnpjCentro: '123',
  dataFundacao: '2020-01-01',
  regional: 'r1',
  endereco: 'Rua Nova, 123',
  cep: '01234-000',
  bairro: 'Centro',
  cidade: 'São Paulo',
  estado: 'SP',
  pais: 'Brasil',
  funcionamento: {
    segunda: [],
    terca: [],
    quarta: [],
    quinta: [],
    sexta: [],
    sabado: [],
    domingo: [],
  },
};

const matchedResult = {
  latitude: -23.55,
  longitude: -46.63,
  formattedAddress: 'Rua Nova, 123, São Paulo, Brasil',
  placeId: 'place-1',
  resultType: 'building',
  confidence: 0.99,
  confidenceBuilding: 0.99,
  matchType: 'full_match',
  city: 'São Paulo',
  state: 'São Paulo',
  stateCode: 'SP',
  country: 'Brasil',
  countryCode: 'br',
  postcode: '01234-000',
};

describe('GeocodingService', () => {
  let repository: { findById: jest.Mock; saveLocation: jest.Mock };
  let provider: { geocode: jest.Mock };
  let service: GeocodingService;

  beforeEach(() => {
    repository = {
      findById: jest.fn().mockResolvedValue(centro),
      saveLocation: jest.fn().mockResolvedValue(centro),
    };
    provider = {
      geocode: jest.fn().mockResolvedValue(matchedResult),
    };
    service = new GeocodingService(
      repository as unknown as CentroRepository,
      provider,
    );
  });

  it('does not call the provider for an insufficient address', async () => {
    repository.findById.mockResolvedValue({
      ...centro,
      endereco: 'sem endereço',
    });

    await expect(service.updateLocation('c1')).resolves.toBeUndefined();

    expect(provider.geocode).not.toHaveBeenCalled();
    expect(repository.saveLocation).not.toHaveBeenCalled();
  });

  it('records provider failures as errors and propagates them for retry', async () => {
    provider.geocode.mockRejectedValue(new Error('Geoapify unavailable'));

    await expect(service.updateLocation('c1')).rejects.toThrow(
      'Geoapify unavailable',
    );

    expect(repository.saveLocation).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ endereco: centro.endereco }),
      expect.objectContaining({
        status: 'ERRO',
        origin: 'GEOAPIFY',
        addressHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    );
  });

  it('confirms a provider result that matches the current address', async () => {
    await expect(service.updateLocation('c1')).resolves.toBeUndefined();

    expect(repository.saveLocation).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({
        endereco: centro.endereco,
        cidade: centro.cidade,
        pais: centro.pais,
      }),
      expect.objectContaining({
        status: 'CONFIRMADA',
        latitude: matchedResult.latitude,
        longitude: matchedResult.longitude,
        confidence: matchedResult.confidence,
        origin: 'GEOAPIFY',
        placeId: matchedResult.placeId,
        formattedAddress: matchedResult.formattedAddress,
      }),
    );
  });

  it('rejects a result if the center address changed before persistence', async () => {
    repository.saveLocation.mockRejectedValue(
      new ConflictException('Address changed'),
    );

    await expect(service.updateLocation('c1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});

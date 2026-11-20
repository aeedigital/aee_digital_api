import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Centro } from '../../domain/entities/centro';
import { CENTRO_REPOSITORY } from '../../domain/repositories/repository.tokens';
import {
  CentroRepository,
  SaveCentroLocationInput,
} from '../../domain/repositories/centro.repository';
import {
  hasSufficientAddress,
  hashAddress,
  isValidCoordinate,
  toCentroAddress,
} from '../../centros/location/location.utils';
import { CentroAddress as GeocodingAddress } from '../../centros/location/location.types';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  placeId?: string;
  resultType?: string;
  confidence?: number;
  confidenceBuilding?: number;
  matchType?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  county?: string;
  countyCode?: string;
  country?: string;
  countryCode?: string;
  postcode?: string;
}

export interface GeocodingProvider {
  geocode(address: GeocodingAddress): Promise<GeocodingResult | null>;
}

export const GEOCODING_PROVIDER = Symbol('GEOCODING_PROVIDER');

const COUNTRY_CODES: Record<string, string> = {
  ALEMANHA: 'de',
  GERMANY: 'de',
  ARGENTINA: 'ar',
  AUSTRALIA: 'au',
  BRASIL: 'br',
  BRAZIL: 'br',
  CANADA: 'ca',
  CUBA: 'cu',
  'ESTADOS UNIDOS': 'us',
  PORTUGAL: 'pt',
  'UNITED STATES': 'us',
  'UNITED STATES OF AMERICA': 'us',
};

function normalize(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('pt-BR');
}

function matchesText(expected: unknown, candidates: unknown[]): boolean {
  const normalizedExpected = normalize(expected);
  if (!normalizedExpected) return true;

  return candidates.map(normalize).filter(Boolean).some(
    (candidate) =>
      candidate === normalizedExpected ||
      (candidate.length > 3 &&
        normalizedExpected.length > 3 &&
        (candidate.includes(normalizedExpected) ||
          normalizedExpected.includes(candidate))),
  );
}

function matchesAdministrativeArea(
  expected: unknown,
  candidates: unknown[],
): boolean {
  return matchesText(
    expected,
    candidates.flatMap((candidate) => [
      candidate,
      String(candidate ?? '').split('-').pop(),
    ]),
  );
}

function countryCode(value: unknown): string | undefined {
  const normalized = normalize(value);
  if (/^[a-z]{2}$/.test(normalized)) return normalized;
  const key = normalized.toLocaleUpperCase('pt-BR');
  return COUNTRY_CODES[key];
}

function matchesCountry(expected: unknown, candidates: unknown[]): boolean {
  const expectedCode = countryCode(expected);
  const candidateCodes = candidates.map(countryCode).filter(Boolean);
  return expectedCode && candidateCodes.length
    ? candidateCodes.includes(expectedCode)
    : matchesText(expected, candidates);
}

function matchesPostcode(expected: string, actual?: string): boolean {
  const expectedDigits = expected.replace(/\D/g, '');
  const actualDigits = String(actual ?? '').replace(/\D/g, '');
  if (!expectedDigits) return true;
  if (!actualDigits) return false;
  return (
    expectedDigits === actualDigits ||
    expectedDigits.startsWith(actualDigits) ||
    actualDigits.startsWith(expectedDigits)
  );
}

function isConfirmedAddressMatch(
  address: GeocodingAddress,
  result: GeocodingResult,
): boolean {
  const addressHasNumber = /\d/.test(address.ENDERECO);
  return (
    result.matchType === 'full_match' &&
    (result.confidence ?? 0) >= 0.95 &&
    (!addressHasNumber || (result.confidenceBuilding ?? 0) >= 0.95) &&
    matchesText(address.CIDADE, [result.city]) &&
    matchesAdministrativeArea(address.ESTADO, [
      result.state,
      result.stateCode,
      result.county,
      result.countyCode,
    ]) &&
    matchesCountry(address.PAIS, [result.country, result.countryCode]) &&
    matchesPostcode(address.CEP, result.postcode)
  );
}

function toRepositoryAddress(centro: Centro) {
  return {
    endereco: centro.endereco,
    cep: centro.cep,
    bairro: centro.bairro,
    cidade: centro.cidade,
    estado: centro.estado,
    pais: centro.pais,
  };
}

function toGeocodingAddress(centro: Centro): GeocodingAddress {
  return toCentroAddress({
    ENDERECO: centro.endereco,
    CEP: centro.cep,
    BAIRRO: centro.bairro,
    CIDADE: centro.cidade,
    ESTADO: centro.estado,
    PAIS: centro.pais,
  });
}

@Injectable()
export class GeoapifyGeocodingProvider implements GeocodingProvider {
  async geocode(address: GeocodingAddress): Promise<GeocodingResult | null> {
    const apiKey = process.env.GEOAPIFY_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('GEOAPIFY_API_KEY is not configured');
    }

    const params = new URLSearchParams({
      street: address.ENDERECO,
      city: address.CIDADE,
      country: address.PAIS,
      format: 'json',
      limit: '1',
      apiKey,
    });
    if (address.CEP) params.set('postcode', address.CEP);
    if (address.ESTADO) params.set('state', address.ESTADO);
    if (address.BAIRRO) params.set('suburb', address.BAIRRO);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/search?${params.toString()}`,
        {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'aee-digital-summary-worker/1.0',
          },
          signal: controller.signal,
        },
      );
      if (response.status === 429) {
        throw new Error('Geoapify rate limit reached');
      }
      if (!response.ok) {
        throw new Error(`Geoapify returned HTTP ${response.status}`);
      }

      const payload = (await response.json()) as {
        results?: Array<Record<string, any>>;
      };
      const result = payload.results?.[0];
      if (
        !result ||
        typeof result.lat !== 'number' ||
        typeof result.lon !== 'number'
      ) {
        return null;
      }

      return {
        latitude: result.lat,
        longitude: result.lon,
        formattedAddress: result.formatted,
        placeId: result.place_id,
        resultType: result.result_type,
        confidence: result.rank?.confidence,
        confidenceBuilding: result.rank?.confidence_building_level,
        matchType: result.rank?.match_type,
        city: result.city,
        state: result.state,
        stateCode: result.state_code,
        county: result.county,
        countyCode: result.county_code,
        country: result.country,
        countryCode: result.country_code,
        postcode: result.postcode,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Geoapify request timed out');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

@Injectable()
export class GeocodingService {
  constructor(
    @Inject(CENTRO_REPOSITORY)
    private readonly repository: CentroRepository,
    @Inject(GEOCODING_PROVIDER)
    private readonly provider: GeocodingProvider,
  ) {}

  async updateLocation(centroId: string): Promise<void> {
    const centro = await this.repository.findById(centroId);
    if (!centro) {
      throw new NotFoundException('Centro not found');
    }

    const address = toGeocodingAddress(centro);
    const addressHash = hashAddress(address);
    if (!hasSufficientAddress(address)) return;

    if (
      centro.location?.addressHash === addressHash &&
      ['CONFIRMADA', 'APROXIMADA', 'NAO_ENCONTRADA'].includes(
        centro.location.status,
      )
    ) {
      return;
    }

    const expectedAddress = toRepositoryAddress(centro);
    let result: GeocodingResult | null;
    try {
      result = await this.provider.geocode(address);
      if (
        result &&
        !isValidCoordinate(result.latitude, result.longitude)
      ) {
        throw new TypeError('Geoapify returned invalid coordinates');
      }
    } catch (error) {
      const failedLocation: SaveCentroLocationInput = {
        status: 'ERRO',
        origin: 'GEOAPIFY',
        addressHash,
        errorCode: 'GEOAPIFY_ERROR',
      };
      await this.repository.saveLocation(
        centroId,
        expectedAddress,
        failedLocation,
      );
      throw error;
    }

    const location: SaveCentroLocationInput = result
      ? {
          latitude: result.latitude,
          longitude: result.longitude,
          status: isConfirmedAddressMatch(address, result)
            ? 'CONFIRMADA'
            : 'APROXIMADA',
          precision: result.resultType?.toLocaleUpperCase('pt-BR'),
          confidence: result.confidence,
          origin: 'GEOAPIFY',
          placeId: result.placeId,
          formattedAddress: result.formattedAddress,
          addressHash,
        }
      : {
          status: 'NAO_ENCONTRADA',
          origin: 'GEOAPIFY',
          addressHash,
        };

    await this.repository.saveLocation(
      centroId,
      expectedAddress,
      location,
    );
  }
}

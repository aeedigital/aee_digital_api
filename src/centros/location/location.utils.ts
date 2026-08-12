import { createHash } from 'crypto';
import { ADDRESS_FIELDS, CentroAddress } from './location.types';

const INVALID_ADDRESS_VALUES = new Set([
  '',
  '-',
  'n/a',
  'nao informado',
  'não informado',
  'sem endereco',
  'sem endereço',
  '(sem endereco)',
  '(sem endereço)',
]);

export function normalizeAddressValue(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('pt-BR');
}

export function toCentroAddress(source: Record<string, any>): CentroAddress {
  return ADDRESS_FIELDS.reduce(
    (address, field) => ({
      ...address,
      [field]: String(source?.[field] ?? '').trim(),
    }),
    {} as CentroAddress,
  );
}

export function hashAddress(address: CentroAddress): string {
  const canonical = ADDRESS_FIELDS.map(
    (field) => `${field}:${normalizeAddressValue(address[field])}`,
  ).join('|');
  return createHash('sha256').update(canonical).digest('hex');
}

export function hasSufficientAddress(address: CentroAddress): boolean {
  return [address.ENDERECO, address.CIDADE, address.PAIS].every(
    (value) => !INVALID_ADDRESS_VALUES.has(normalizeAddressValue(value)),
  );
}

export function isValidCoordinate(
  latitude: number,
  longitude: number,
): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

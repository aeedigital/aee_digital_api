export const ADDRESS_FIELDS = [
  'ENDERECO',
  'CEP',
  'BAIRRO',
  'CIDADE',
  'ESTADO',
  'PAIS',
] as const;

export type AddressField = (typeof ADDRESS_FIELDS)[number];
export type CentroAddress = Record<AddressField, string>;

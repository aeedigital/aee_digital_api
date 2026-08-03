import { Centro, CentroLocation } from '../domain/entities/centro';
import { toBrazilTimestamp } from '../base/date-timezone.helper';
import { toAttendanceResponse } from '../summary/summary.presenter';

function compactObject(source: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined),
  );
}

function toLocationResponse(location?: CentroLocation) {
  return compactObject({
    LATITUDE: location?.latitude ?? null,
    LONGITUDE: location?.longitude ?? null,
    STATUS: location?.status ?? 'PENDENTE',
    PRECISAO: location?.precision,
    CONFIANCA: location?.confidence,
    ORIGEM: location?.origin,
    PLACE_ID: location?.placeId,
    ENDERECO_FORMATADO: location?.formattedAddress,
    ATUALIZADA_EM: location?.updatedAt?.toISOString(),
  });
}

export function toCentroResponse(centro: Centro) {
  return {
    _id: centro.id,
    FUNCIONAMENTO: centro.funcionamento,
    NOME_CENTRO: centro.nomeCentro,
    NOME_CURTO: centro.nomeCurto,
    CNPJ_CENTRO: centro.cnpjCentro,
    DATA_FUNDACAO: centro.dataFundacao,
    REGIONAL: centro.regional,
    ENDERECO: centro.endereco,
    CEP: centro.cep,
    BAIRRO: centro.bairro,
    CIDADE: centro.cidade,
    ESTADO: centro.estado,
    PAIS: centro.pais,
    ...(centro.telefone ? { TELEFONE: centro.telefone } : {}),
    ...(centro.site ? { SITE: centro.site } : {}),
    LOCALIZACAO: toLocationResponse(centro.location),
    ...(centro.attendanceSummary
      ? { ATENDIMENTOS: toAttendanceResponse(centro.attendanceSummary) }
      : {}),
    createdAt: toBrazilTimestamp(centro.createdAt),
    updatedAt: toBrazilTimestamp(centro.updatedAt),
  };
}

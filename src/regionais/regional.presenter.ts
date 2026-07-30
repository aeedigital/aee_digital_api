import { Regional } from '../domain/entities/regional';

export function toRegionalResponse(regional: Regional) {
  return {
    _id: regional.id,
    NOME_REGIONAL: regional.nomeRegional,
    PAIS: regional.pais,
    COORDENADOR_ID: regional.coordenadorId,
  };
}

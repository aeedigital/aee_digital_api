import { toRegionalResponse } from './regional.presenter';
import { toPessoaResponse } from '../pessoas/pessoa.presenter';
import { toCentroResponse } from '../centros/centro.presenter';
import { toSummaryResponse } from '../summary/summary.presenter';
import { Form } from '../domain/entities/form';

function mapForm(form: any) {
  if (!form) return null;
  return {
    _id: (form as any).id,
    PAGES: (form as any).PAGES || (form as any).pages,
  };
}

export function toCoordSummaryResponse(payload: any) {
  return {
    regional: toRegionalResponse(payload.regional),
    coordenador: payload.coordenador ? toPessoaResponse(payload.coordenador) : null,
    centros: (payload.centros || []).map(toCentroResponse),
    summaries: (payload.summaries || []).map(toSummaryResponse),
    form: mapForm(payload.form),
    coordenadores: (payload.coordenadores || []).map(toPessoaResponse),
  };
}

import { Pass } from '../domain/entities/pass';
import { toBrazilTimestamp } from '../base/date-timezone.helper';

export function toPassResponse(pass: Pass) {
  return {
    _id: pass.id,
    user: pass.user,
    pass: pass.pass,
    scope_id: pass.scopeId,
    groups: pass.groups,
    lastLogged: pass.lastLogged,
    createdAt: toBrazilTimestamp(pass.createdAt),
    updatedAt: toBrazilTimestamp(pass.updatedAt),
  };
}

import { Pass } from '../domain/entities/pass';

export function toPassResponse(pass: Pass) {
  return {
    _id: pass.id,
    user: pass.user,
    pass: pass.pass,
    scope_id: pass.scopeId,
    groups: pass.groups,
    lastLogged: pass.lastLogged,
    createdAt: pass.createdAt,
    updatedAt: pass.updatedAt,
  };
}

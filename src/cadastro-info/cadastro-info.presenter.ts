import { toBrazilTimestamp } from '../base/date-timezone.helper';
import { CadastroInfo } from '../domain/entities/cadastro-info';

export function toCadastroInfoResponse(item: CadastroInfo) {
  return {
    _id: item.id,
    START_DATE: item.startDate,
    END_DATE: item.endDate,
    FORM_ID: item.formId,
    IS_ACTIVE: item.isActive,
    createdAt: toBrazilTimestamp(item.createdAt),
    updatedAt: toBrazilTimestamp(item.updatedAt),
  };
}

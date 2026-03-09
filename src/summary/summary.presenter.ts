import { Summary } from '../domain/entities/summary';
import { toBrazilTimestamp } from '../base/date-timezone.helper';

export function toSummaryResponse(summary: Summary) {
  return {
    _id: summary.id,
    FORM_ID: summary.formId,
    CENTRO_ID: summary.centroId,
    QUESTIONS: summary.questions?.map((q) => ({
      ANSWER: q.answer,
      QUESTION: q.questionId,
    })),
    validatedByCoordAt: toBrazilTimestamp(summary.validatedByCoordAt),
    createdAt: toBrazilTimestamp(summary.createdAt),
    updatedAt: toBrazilTimestamp(summary.updatedAt),
  };
}

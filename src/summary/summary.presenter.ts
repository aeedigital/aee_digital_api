import { Summary } from '../domain/entities/summary';

export function toSummaryResponse(summary: Summary) {
  return {
    _id: summary.id,
    FORM_ID: summary.formId,
    CENTRO_ID: summary.centroId,
    QUESTIONS: summary.questions?.map((q) => ({
      ANSWER: q.answer,
      QUESTION: q.questionId,
    })),
    validatedByCoordAt: summary.validatedByCoordAt,
    createdAt: summary.createdAt,
    updatedAt: summary.updatedAt,
  };
}

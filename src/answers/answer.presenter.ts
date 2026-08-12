import { Answer } from '../domain/entities/answer';
import { toBrazilTimestamp } from '../base/date-timezone.helper';

export function toAnswerResponse(answer: Answer) {
  return {
    _id: answer.id,
    QUESTION_ID: answer.questionId,
    CENTRO_ID: answer.centroId,
    ANSWER: answer.answer,
    QUIZ_ID: answer.quizId,
    FORM_ID: answer.formId,
    GROUP_KEY: answer.groupKey,
    GROUP_INSTANCE_ID: answer.groupInstanceId,
    GROUP_OCCURRENCE_ORDER: answer.groupOccurrenceOrder,
    QUESTION_ORDER: answer.questionOrder,
    createdAt: toBrazilTimestamp(answer.createdAt),
    updatedAt: toBrazilTimestamp(answer.updatedAt),
  };
}

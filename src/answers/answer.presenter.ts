import { Answer } from '../domain/entities/answer';
import { toBrazilTimestamp } from '../base/date-timezone.helper';

export function toAnswerResponse(answer: Answer) {
  return {
    _id: answer.id,
    QUESTION_ID: answer.questionId,
    CENTRO_ID: answer.centroId,
    ANSWER: answer.answer,
    QUIZ_ID: answer.quizId,
    createdAt: toBrazilTimestamp(answer.createdAt),
    updatedAt: toBrazilTimestamp(answer.updatedAt),
  };
}

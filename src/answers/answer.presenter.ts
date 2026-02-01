import { Answer } from '../domain/entities/answer';

export function toAnswerResponse(answer: Answer) {
  return {
    _id: answer.id,
    QUESTION_ID: answer.questionId,
    CENTRO_ID: answer.centroId,
    ANSWER: answer.answer,
    QUIZ_ID: answer.quizId,
    createdAt: answer.createdAt,
    updatedAt: answer.updatedAt,
  };
}

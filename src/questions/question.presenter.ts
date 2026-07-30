import { QuestionEntity } from '../domain/entities/question';

export function toQuestionResponse(q: QuestionEntity) {
  return {
    _id: q.id,
    QUESTION: q.question,
    ANSWER_TYPE: q.answerType,
    IS_REQUIRED: q.isRequired,
    IS_MULTIPLE: q.isMultiple,
    PRESET_VALUES: q.presetValues,
    ROLE: q.role,
  };
}

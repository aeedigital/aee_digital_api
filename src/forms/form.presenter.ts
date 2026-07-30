import { Form } from '../domain/entities/form';
import { toBrazilTimestamp } from '../base/date-timezone.helper';

export function toFormResponse(form: Form) {
  return {
    _id: form.id,
    NAME: (form as any).name,
    VERSION: (form as any).version,
    CREATEDBY: (form as any).createdBy,
    PAGES: (form.pages || []).map((page: any) => ({
      NAME: page.name,
      ROLE: page.role,
      QUIZES: (page.quizes || []).map((quiz: any) => ({
        CATEGORY: quiz.category,
        QUESTIONS: (quiz.questions || []).map((question: any) => ({
          GROUP: question.group,
          IS_MULTIPLE: question.isMultiple,
          // Se a questão já veio populada com campos do Mongo, preservamos
          ...(Array.isArray(question.group) && question.group[0]?.QUESTION
            ? {}
            : {}),
        })),
      })),
    })),
    createdAt: toBrazilTimestamp(form.createdAt),
    updatedAt: toBrazilTimestamp(form.updatedAt),
  };
}

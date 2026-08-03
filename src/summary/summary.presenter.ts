import { Summary } from '../domain/entities/summary';
import { toBrazilTimestamp } from '../base/date-timezone.helper';

export function toAttendanceResponse(summary: Summary) {
  if (!summary.attendance) return undefined;
  return {
    SUMMARY_ID: summary.id,
    ATUALIZADO_EM: summary.updatedAt?.toISOString() || summary.createdAt?.toISOString(),
    ATIVIDADES: summary.attendance.activities.map((activity) => ({
      CODIGO: activity.code,
      NOME: activity.name,
      PUBLICO: activity.audience,
      ENCONTROS: activity.encounters.map((encounter) => ({
        DIA: encounter.day,
        HORARIO_INICIO: encounter.startTime,
        GROUP_INSTANCE_ID: encounter.groupInstanceId,
      })),
    })),
    PUBLICOS: summary.attendance.audiences.map((audience) => ({
      CODIGO: audience.code,
      NOME: audience.name,
      IDADE_MINIMA: audience.ageMin,
      IDADE_MAXIMA: audience.ageMax,
      ENCONTROS: audience.encounters.map((encounter) => ({
        DIA: encounter.day,
        HORARIO_INICIO: encounter.startTime,
        GROUP_INSTANCE_ID: encounter.groupInstanceId,
        ATIVIDADE_CODIGO: encounter.activityCode,
      })),
    })),
  };
}

export function toSummaryResponse(summary: Summary) {
  return {
    _id: summary.id,
    FORM_ID: summary.formId,
    CENTRO_ID: summary.centroId,
    QUESTIONS: summary.questions?.map((q) => ({
      ANSWER: q.answer,
      QUESTION: q.questionId,
      ANSWER_ID: q.answerId,
      GROUP_KEY: q.groupKey,
      GROUP_INSTANCE_ID: q.groupInstanceId,
      OCCURRENCE_ORDER: q.occurrenceOrder,
      QUESTION_ORDER: q.questionOrder,
      QUESTION_LABEL: q.questionLabel,
      ANSWER_TYPE: q.answerType,
    })),
    schemaVersion: summary.schemaVersion,
    FORM_SNAPSHOT: summary.formSnapshot,
    COORDINATION_SNAPSHOT: summary.coordinationSnapshot,
    ATENDIMENTOS: toAttendanceResponse(summary),
    DIVULGACAO_AUTORIZADA: summary.publicationAuthorized,
    reconstruction: summary.reconstruction,
    validatedByCoordAt: toBrazilTimestamp(summary.validatedByCoordAt),
    createdAt: toBrazilTimestamp(summary.createdAt),
    updatedAt: toBrazilTimestamp(summary.updatedAt),
  };
}

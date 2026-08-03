import { createHash } from 'node:crypto';
import { Answer } from '../../domain/entities/answer';
import { Form, FormQuestionGroup } from '../../domain/entities/form';
import {
  AttendanceActivity,
  AttendanceAudience,
  AttendanceEncounter,
  SummaryAttendance,
  SummaryFormSnapshot,
  SummaryQuestion,
  SummarySnapshotAnswer,
} from '../../domain/entities/summary';

const AUDIENCE_BY_CATEGORY: Record<
  string,
  { code: string; name: string; ageMin?: number; ageMax?: number }
> = {
  ASSISTENCIA_ESPIRITUAL: { code: 'PUBLICO_GERAL', name: 'Publico geral' },
  EVANGELIZACAO_INFANTIL: {
    code: 'CRIANCAS_0_12',
    name: 'Criancas de 0 a 12 anos',
    ageMin: 0,
    ageMax: 12,
  },
  PRE_MOCIDADE: {
    code: 'ADOLESCENTES_12_14',
    name: 'Adolescentes de 12 a 14 anos',
    ageMin: 12,
    ageMax: 14,
  },
  MOCIDADE: {
    code: 'MOCIDADE_14_18',
    name: 'Mocidade de 14 a 18 anos',
    ageMin: 14,
    ageMax: 18,
  },
};

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

function toCode(value: string): string {
  return normalizeText(value)
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function stableLegacyOccurrenceId(groupKey: string, order: number): string {
  const digest = createHash('sha256')
    .update(`${groupKey}:${order}`)
    .digest('hex')
    .slice(0, 20);
  return `legacy-${digest}`;
}

function answerTimestamp(answer: Answer): number {
  const explicit = answer.updatedAt || answer.createdAt;
  if (explicit) return explicit.getTime();
  const objectIdPrefix = answer.id?.slice(0, 8);
  return objectIdPrefix && /^[a-f\d]{8}$/i.test(objectIdPrefix)
    ? Number.parseInt(objectIdPrefix, 16) * 1000
    : 0;
}

function sortAnswers(items: Answer[]): Answer[] {
  return [...items].sort((left, right) => {
    const occurrence =
      (left.groupOccurrenceOrder ?? Number.MAX_SAFE_INTEGER) -
      (right.groupOccurrenceOrder ?? Number.MAX_SAFE_INTEGER);
    if (occurrence !== 0) return occurrence;
    const timestamp = answerTimestamp(left) - answerTimestamp(right);
    return timestamp || left.id.localeCompare(right.id);
  });
}

function toSnapshotAnswer(
  questionId: string,
  answer?: Answer,
): SummarySnapshotAnswer {
  return {
    questionId,
    answerId: answer?.id,
    rawValue: answer?.answer ?? '',
    displayValue: answer?.answer ?? '',
    sourceCreatedAt: answer?.createdAt,
    sourceUpdatedAt: answer?.updatedAt,
  };
}

function asQuestion(value: string | FormQuestionGroup): FormQuestionGroup {
  return typeof value === 'string' ? { id: value } : value;
}

function buildOccurrenceIds(
  groupKey: string,
  isMultiple: boolean,
  questionIds: string[],
  answersByQuestion: Map<string, Answer[]>,
): string[] {
  if (!isMultiple) return [`${groupKey}/occurrence:0`];

  const explicit = new Map<string, number>();
  questionIds.forEach((questionId) => {
    (answersByQuestion.get(questionId) || []).forEach((answer) => {
      if (answer.groupInstanceId) {
        explicit.set(
          answer.groupInstanceId,
          Math.min(
            explicit.get(answer.groupInstanceId) ?? Number.MAX_SAFE_INTEGER,
            answer.groupOccurrenceOrder ?? Number.MAX_SAFE_INTEGER,
          ),
        );
      }
    });
  });
  if (explicit.size) {
    return [...explicit.entries()]
      .sort((left, right) => left[1] - right[1] || left[0].localeCompare(right[0]))
      .map(([id]) => id);
  }

  const count = Math.max(
    1,
    ...questionIds.map((id) => answersByQuestion.get(id)?.length || 0),
  );
  return Array.from({ length: count }, (_, index) =>
    stableLegacyOccurrenceId(groupKey, index),
  );
}

export function buildFormSnapshot(form: Form, answers: Answer[]): SummaryFormSnapshot {
  const answersByQuestion = new Map<string, Answer[]>();
  answers.forEach((answer) => {
    const current = answersByQuestion.get(answer.questionId) || [];
    current.push(answer);
    answersByQuestion.set(answer.questionId, current);
  });
  answersByQuestion.forEach((items, key) =>
    answersByQuestion.set(key, sortAnswers(items)),
  );

  return {
    id: form.id,
    name: form.name,
    version: form.version,
    pages: form.pages.map((page, pageIndex) => ({
      pageKey: `page:${pageIndex}`,
      pageName: page.name || `Pagina ${pageIndex + 1}`,
      role: page.role,
      order: pageIndex,
      quizzes: page.quizes.map((quiz, quizIndex) => ({
        quizKey: `page:${pageIndex}/quiz:${quizIndex}`,
        category: quiz.category,
        order: quizIndex,
        groups: quiz.questions.map((group, groupIndex) => {
          const groupKey = `page:${pageIndex}/quiz:${quizIndex}/group:${groupIndex}`;
          const questions = group.group.map(asQuestion);
          const questionIds = questions.map((question) => question.id);
          const occurrenceIds = buildOccurrenceIds(
            groupKey,
            Boolean(group.isMultiple),
            questionIds,
            answersByQuestion,
          );

          return {
            groupKey,
            isMultiple: Boolean(group.isMultiple),
            order: groupIndex,
            questions: questions.map((question, questionIndex) => ({
              questionId: question.id,
              label: question.question || '',
              answerType: question.answerType || 'String',
              isRequired: Boolean(question.isRequired),
              presetValues: question.presetValues || [],
              order: questionIndex,
            })),
            occurrences: occurrenceIds.map((occurrenceId, occurrenceOrder) => ({
              occurrenceId,
              order: occurrenceOrder,
              answers: questions.map((question) => {
                const candidates = answersByQuestion.get(question.id) || [];
                const answer = candidates.find(
                  (item) => item.groupInstanceId === occurrenceId,
                ) ?? (occurrenceId.startsWith('legacy-')
                  ? candidates[occurrenceOrder]
                  : !group.isMultiple
                    ? candidates[candidates.length - 1]
                    : undefined);
                return toSnapshotAnswer(question.id, answer);
              }),
            })),
          };
        }),
      })),
    })),
  };
}

export function flattenSnapshot(snapshot: SummaryFormSnapshot): SummaryQuestion[] {
  return snapshot.pages.flatMap((page) =>
    page.quizzes.flatMap((quiz) =>
      quiz.groups.flatMap((group) =>
        group.occurrences.flatMap((occurrence) =>
          occurrence.answers.map((answer) => {
            const question = group.questions.find(
              (item) => item.questionId === answer.questionId,
            );
            return {
              answer: answer.rawValue,
              questionId: answer.questionId,
              answerId: answer.answerId,
              groupKey: group.groupKey,
              groupInstanceId: occurrence.occurrenceId,
              occurrenceOrder: occurrence.order,
              questionOrder: question?.order,
              questionLabel: question?.label,
              answerType: question?.answerType,
            };
          }),
        ),
      ),
    ),
  );
}

function normalizeDay(value: string): string | undefined {
  const normalized = normalizeText(value).replace(/\s+/g, '-');
  const aliases: Record<string, string> = {
    SEGUNDA: 'SEGUNDA-FEIRA',
    'SEGUNDA-FEIRA': 'SEGUNDA-FEIRA',
    TERCA: 'TERCA-FEIRA',
    'TERCA-FEIRA': 'TERCA-FEIRA',
    QUARTA: 'QUARTA-FEIRA',
    'QUARTA-FEIRA': 'QUARTA-FEIRA',
    QUINTA: 'QUINTA-FEIRA',
    'QUINTA-FEIRA': 'QUINTA-FEIRA',
    SEXTA: 'SEXTA-FEIRA',
    'SEXTA-FEIRA': 'SEXTA-FEIRA',
    SABADO: 'SABADO',
    DOMINGO: 'DOMINGO',
  };
  return aliases[normalized];
}

function normalizeTime(value: string): string | undefined {
  const normalized = String(value ?? '').trim();
  const match = /^(\d{1,2})(?::|h)(\d{2})$/i.exec(normalized);
  if (!match) return undefined;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return undefined;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function derivePublicationAuthorization(snapshot: SummaryFormSnapshot): boolean {
  const matching = flattenSnapshot(snapshot).filter((question) => {
    const label = normalizeText(question.questionLabel);
    return (
      question.questionId === '659467a52f490be057cc4341' ||
      (label.includes('AUTORIZA') &&
        label.includes('DIVULG') &&
        label.includes('SITE'))
    );
  });
  const value = normalizeText(matching[matching.length - 1]?.answer);
  return ['TRUE', 'SIM', 'S', '1'].includes(value);
}

export function deriveAttendance(snapshot: SummaryFormSnapshot): SummaryAttendance {
  const activities: AttendanceActivity[] = [];

  snapshot.pages.forEach((page) =>
    page.quizzes.forEach((quiz) =>
      quiz.groups.forEach((group) => {
        const dayQuestion = group.questions.find((question) =>
          normalizeText(question.label).includes('DIA DA SEMANA'),
        );
        const timeQuestion = group.questions.find(
          (question) =>
            normalizeText(question.label).includes('HORARIO DE INICIO') ||
            normalizeText(question.answerType) === 'TIME',
        );
        if (!dayQuestion || !timeQuestion) return;

        const activityCode = toCode(quiz.category);
        const audience = AUDIENCE_BY_CATEGORY[activityCode];
        const encounters = group.occurrences.flatMap((occurrence) => {
          const day = normalizeDay(
            occurrence.answers.find(
              (answer) => answer.questionId === dayQuestion.questionId,
            )?.rawValue || '',
          );
          const startTime = normalizeTime(
            occurrence.answers.find(
              (answer) => answer.questionId === timeQuestion.questionId,
            )?.rawValue || '',
          );
          return day && startTime
            ? [{ day, startTime, groupInstanceId: occurrence.occurrenceId }]
            : [];
        });
        if (encounters.length) {
          activities.push({
            code: activityCode,
            name: quiz.category,
            audience: audience?.code,
            encounters,
          });
        }
      }),
    ),
  );

  const audiences = new Map<string, AttendanceAudience>();
  activities.forEach((activity) => {
    if (!activity.audience) return;
    const definition = AUDIENCE_BY_CATEGORY[activity.code];
    const current = audiences.get(activity.audience) || {
      ...definition,
      encounters: [],
    };
    current.encounters.push(
      ...activity.encounters.map((encounter): AttendanceEncounter => ({
        ...encounter,
        activityCode: activity.code,
      })),
    );
    audiences.set(activity.audience, current);
  });

  return { activities, audiences: [...audiences.values()] };
}

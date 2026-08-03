import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { BSON, Document, MongoClient } from 'mongodb';
import { buildFormSnapshot, deriveAttendance, derivePublicationAuthorization, flattenSnapshot } from '../src/application/summary/summary.snapshot';
import { Answer } from '../src/domain/entities/answer';
import { Form } from '../src/domain/entities/form';
import { SummaryFormSnapshot } from '../src/domain/entities/summary';

type Mode = 'dry-run' | 'apply' | 'verify' | 'rollback';
type Args = { mode: Mode; uri: string; dbName?: string; runId: string; outputDir: string };

const META_FIELDS = ['FORM_ID', 'GROUP_KEY', 'GROUP_INSTANCE_ID', 'GROUP_OCCURRENCE_ORDER', 'QUESTION_ORDER'] as const;

function parseArgs(): Args {
  const values = process.argv.slice(2);
  const mode = values[0] as Mode;
  if (!['dry-run', 'apply', 'verify', 'rollback'].includes(mode)) {
    throw new Error('Uso: summary-v2-backfill.ts <dry-run|apply|verify|rollback> --uri-env NOME [--db DB] [--run-id ID] [--output-dir DIR]');
  }
  const option = (name: string) => {
    const index = values.indexOf(name);
    return index >= 0 ? values[index + 1] : undefined;
  };
  const uriEnvironment = option('--uri-env');
  if (!uriEnvironment || !process.env[uriEnvironment]) {
    throw new Error('--uri-env deve apontar explicitamente para uma variável de ambiente contendo a URI MongoDB.');
  }
  const runId = option('--run-id') || new Date().toISOString().replace(/[-:.TZ]/g, '');
  return {
    mode,
    uri: process.env[uriEnvironment] as string,
    dbName: option('--db'),
    runId,
    outputDir: resolve(option('--output-dir') || '.maintenance/summary-v2'),
  };
}

function stringId(value: unknown) {
  return String((value as Document)?._id ?? value ?? '');
}

function deterministicOccurrenceId(centroId: string, formId: string, groupKey: string, order: number) {
  return `legacy-${createHash('sha256').update(`${centroId}:${formId}:${groupKey}:${order}`).digest('hex').slice(0, 24)}`;
}

function coreHash(documents: Document[]) {
  const hash = createHash('sha256');
  [...documents].sort((a, b) => stringId(a._id).localeCompare(stringId(b._id))).forEach((item) => {
    hash.update(JSON.stringify({
      _id: stringId(item._id),
      CENTRO_ID: stringId(item.CENTRO_ID),
      QUESTION_ID: stringId(item.QUESTION_ID),
      ANSWER: item.ANSWER,
      QUIZ_ID: stringId(item.QUIZ_ID),
    }));
    hash.update('\n');
  });
  return hash.digest('hex');
}

function toForm(raw: Document, questions: Map<string, Document>): Form {
  return {
    id: stringId(raw._id),
    name: raw.NAME,
    version: raw.VERSION,
    createdBy: raw.CREATEDBY,
    pages: (raw.PAGES || []).map((page: Document) => ({
      name: page.PAGE_NAME || page.NAME || '',
      role: page.ROLE,
      quizes: (page.QUIZES || []).map((quiz: Document) => ({
        category: quiz.CATEGORY || '',
        questions: (quiz.QUESTIONS || []).map((group: Document) => ({
          isMultiple: Boolean(group.IS_MULTIPLE),
          group: (group.GROUP || []).map((reference: unknown) => {
            const question = questions.get(stringId(reference));
            return question ? {
              id: stringId(question._id),
              question: question.QUESTION,
              answerType: question.ANSWER_TYPE,
              isRequired: question.IS_REQUIRED,
              isMultiple: question.IS_MULTIPLE,
              presetValues: question.PRESET_VALUES || [],
              role: question.ROLE,
            } : stringId(reference);
          }),
        })),
      })),
    })),
  };
}

function toAnswer(raw: Document): Answer {
  return {
    id: stringId(raw._id), centroId: String(raw.CENTRO_ID), questionId: stringId(raw.QUESTION_ID),
    answer: String(raw.ANSWER ?? ''), quizId: raw.QUIZ_ID && String(raw.QUIZ_ID),
    formId: raw.FORM_ID && String(raw.FORM_ID), groupKey: raw.GROUP_KEY,
    groupInstanceId: raw.GROUP_INSTANCE_ID, groupOccurrenceOrder: raw.GROUP_OCCURRENCE_ORDER,
    questionOrder: raw.QUESTION_ORDER, createdAt: raw.createdAt, updatedAt: raw.updatedAt,
  };
}

function appendUnresolvedAnswers(
  snapshot: SummaryFormSnapshot,
  answers: Document[],
  questions: Map<string, Document>,
  centroId: string,
) {
  if (!answers.length) return;
  const byQuestion = new Map<string, Document[]>();
  answers.forEach((answer) => {
    const questionId = stringId(answer.QUESTION_ID);
    const items = byQuestion.get(questionId) || [];
    items.push(answer);
    byQuestion.set(questionId, items);
  });
  const pageOrder = snapshot.pages.length;
  snapshot.pages.push({
    pageKey: 'reconstruction:unresolved',
    pageName: 'Respostas legadas não associadas ao formulário',
    role: 'reconstruction',
    order: pageOrder,
    quizzes: [{
      quizKey: 'reconstruction:unresolved/quiz:0',
      category: 'Reconstrução aproximada',
      order: 0,
      groups: [...byQuestion.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([questionId, items], groupOrder) => {
        const groupKey = `reconstruction:question:${questionId}`;
        const question = questions.get(questionId);
        const sorted = [...items].sort((left, right) => {
          const leftTime = left.createdAt?.getTime?.() || 0;
          const rightTime = right.createdAt?.getTime?.() || 0;
          return leftTime - rightTime || stringId(left._id).localeCompare(stringId(right._id));
        });
        return {
          groupKey,
          isMultiple: sorted.length > 1,
          order: groupOrder,
          questions: [{
            questionId,
            label: question?.QUESTION || `Pergunta legada ${questionId}`,
            answerType: question?.ANSWER_TYPE || 'String',
            isRequired: Boolean(question?.IS_REQUIRED),
            presetValues: question?.PRESET_VALUES || [],
            order: 0,
          }],
          occurrences: sorted.map((answer, order) => ({
            occurrenceId: deterministicOccurrenceId(centroId, snapshot.id, groupKey, order),
            order,
            answers: [{
              questionId,
              answerId: stringId(answer._id),
              rawValue: String(answer.ANSWER ?? ''),
              displayValue: String(answer.ANSWER ?? ''),
              sourceCreatedAt: answer.createdAt,
              sourceUpdatedAt: answer.updatedAt,
            }],
          })),
        };
      }),
    }],
  });
}

function answerMetadata(forms: Form[], answers: Document[], latestFormByCentro: Map<string, string>) {
  const locations = new Map<string, Array<{ formId: string; groupKey: string; isMultiple: boolean; questionOrder: number }>>();
  forms.forEach((form) => form.pages.forEach((page, pageIndex) => page.quizes.forEach((quiz, quizIndex) =>
    quiz.questions.forEach((group, groupIndex) => group.group.forEach((question, questionOrder) => {
      const id = typeof question === 'string' ? question : question.id;
      const entries = locations.get(id) || [];
      entries.push({ formId: form.id, groupKey: `page:${pageIndex}/quiz:${quizIndex}/group:${groupIndex}`, isMultiple: group.isMultiple, questionOrder });
      locations.set(id, entries);
    })))));

  const report = {
    orphanAnswers: [] as string[],
    ambiguousAnswers: [] as string[],
    summaryFormMismatches: [] as string[],
  };
  const assignments = new Map<string, Document>();
  const buckets = new Map<string, Map<string, Document[]>>();
  answers.forEach((answer) => {
    let candidates = locations.get(stringId(answer.QUESTION_ID)) || [];
    if (!candidates.length) return report.orphanAnswers.push(stringId(answer._id));
    const preferredFormId = latestFormByCentro.get(String(answer.CENTRO_ID));
    if (preferredFormId) {
      const preferredCandidates = candidates.filter((candidate) => candidate.formId === preferredFormId);
      if (preferredCandidates.length) candidates = preferredCandidates;
      else report.summaryFormMismatches.push(stringId(answer._id));
    }
    if (candidates.length !== 1) {
      report.ambiguousAnswers.push(stringId(answer._id));
      return;
    }
    const location = candidates[0];
    const bucketKey = `${answer.CENTRO_ID}\u0000${location.formId}\u0000${location.groupKey}`;
    const byQuestion = buckets.get(bucketKey) || new Map<string, Document[]>();
    const list = byQuestion.get(stringId(answer.QUESTION_ID)) || [];
    list.push(answer);
    byQuestion.set(stringId(answer.QUESTION_ID), list);
    buckets.set(bucketKey, byQuestion);
    assignments.set(stringId(answer._id), { ...location, centroId: String(answer.CENTRO_ID) });
  });
  buckets.forEach((byQuestion, bucketKey) => {
    const [centroId, formId, groupKey] = bucketKey.split('\u0000');
    byQuestion.forEach((items) => items.sort((a, b) => {
      const left = a.createdAt?.getTime?.() || 0;
      const right = b.createdAt?.getTime?.() || 0;
      return left - right || stringId(a._id).localeCompare(stringId(b._id));
    }).forEach((answer, order) => {
      const assignment = assignments.get(stringId(answer._id)) as Document;
      const occurrenceOrder = assignment.isMultiple ? order : 0;
      assignments.set(stringId(answer._id), {
        FORM_ID: formId, GROUP_KEY: groupKey,
        GROUP_INSTANCE_ID: deterministicOccurrenceId(centroId, formId, groupKey, occurrenceOrder),
        GROUP_OCCURRENCE_ORDER: occurrenceOrder, QUESTION_ORDER: assignment.questionOrder,
      });
    }));
  });
  return { assignments, report };
}

function attendanceDiagnostics(forms: Form[], answers: Document[], assignments: Map<string, Document>) {
  const enriched = answers.map((answer) => ({ ...answer, ...(assignments.get(stringId(answer._id)) || {}) }));
  const invalidDays: Array<{ centroId: string; groupKey: string; occurrenceId: string; value: string }> = [];
  const missingTimes: Array<{ centroId: string; groupKey: string; occurrenceId: string }> = [];
  const validDays = new Set(['SEGUNDA', 'SEGUNDA-FEIRA', 'TERCA', 'TERCA-FEIRA', 'QUARTA', 'QUARTA-FEIRA', 'QUINTA', 'QUINTA-FEIRA', 'SEXTA', 'SEXTA-FEIRA', 'SABADO', 'DOMINGO']);
  const normalize = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase().replace(/\s+/g, '-');
  const validTime = (value: unknown) => /^(?:[01]?\d|2[0-3])(?::|h)[0-5]\d$/i.test(String(value ?? '').trim());
  forms.forEach((form) => {
    const centers = new Set(enriched.filter((answer) => String(answer.FORM_ID) === form.id).map((answer) => String(answer.CENTRO_ID)));
    centers.forEach((centroId) => {
      const snapshot = buildFormSnapshot(form, enriched.filter((answer) => String(answer.CENTRO_ID) === centroId && String(answer.FORM_ID) === form.id).map(toAnswer));
      snapshot.pages.forEach((page) => page.quizzes.forEach((quiz) => quiz.groups.forEach((group) => {
        const dayQuestion = group.questions.find((question) => normalize(question.label).includes('DIA-DA-SEMANA'));
        const timeQuestion = group.questions.find((question) => normalize(question.label).includes('HORARIO-DE-INICIO') || normalize(question.answerType) === 'TIME');
        if (!dayQuestion || !timeQuestion) return;
        group.occurrences.forEach((occurrence) => {
          const day = occurrence.answers.find((answer) => answer.questionId === dayQuestion.questionId)?.rawValue || '';
          const time = occurrence.answers.find((answer) => answer.questionId === timeQuestion.questionId)?.rawValue || '';
          if (day.trim() && !validDays.has(normalize(day))) invalidDays.push({ centroId, groupKey: group.groupKey, occurrenceId: occurrence.occurrenceId, value: day });
          if (day.trim() && !validTime(time)) missingTimes.push({ centroId, groupKey: group.groupKey, occurrenceId: occurrence.occurrenceId });
        });
      })));
    });
  });
  return { invalidDays, missingTimes };
}

async function main() {
  const args = parseArgs();
  await mkdir(args.outputDir, { recursive: true });
  const manifestPath = resolve(args.outputDir, `${args.runId}.manifest.json`);
  const reportPath = resolve(args.outputDir, `${args.runId}.report.json`);
  const client = new MongoClient(args.uri);
  await client.connect();
  const db = args.dbName ? client.db(args.dbName) : client.db();
  const answersCollection = db.collection('answers');
  const journalName = `_summary_v2_answers_journal_${args.runId}`;
  const summaryJournalName = `_summary_v2_summaries_journal_${args.runId}`;
  try {
    if (args.mode === 'rollback') {
      const journal = await db.collection(journalName).find({}).toArray();
      if (!journal.length) throw new Error(`Journal ${journalName} não encontrado ou vazio.`);
      for (const item of journal) await answersCollection.replaceOne({ _id: item.original._id }, item.original, { upsert: true });
      const summaryJournal = await db.collection(summaryJournalName).find({}).toArray();
      for (const item of summaryJournal) {
        await db.collection('summaries').replaceOne({ _id: item.original._id }, item.original, { upsert: true });
      }
      console.log(JSON.stringify({
        mode: args.mode,
        answersRestored: journal.length,
        summariesRestored: summaryJournal.length,
        journals: [journalName, summaryJournalName],
      }));
      return;
    }

    const answers = await answersCollection.find({}).toArray();
    const identity = { count: answers.length, ids: answers.map((item) => stringId(item._id)).sort(), coreHash: coreHash(answers) };
    if (args.mode === 'verify') {
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
      const valid = manifest.before.count === identity.count && manifest.before.coreHash === identity.coreHash &&
        JSON.stringify(manifest.before.ids) === JSON.stringify(identity.ids);
      if (!valid) throw new Error('Falha de reconciliação: quantidade, IDs ou hash dos campos originais divergem.');
      console.log(JSON.stringify({
        mode: args.mode,
        valid: true,
        count: identity.count,
        coreHash: identity.coreHash,
        completeIdSetVerified: true,
      }));
      return;
    }

    const questionDocuments = await db.collection('questions').find({}).toArray();
    const questionMap = new Map(questionDocuments.map((item) => [stringId(item._id), item]));
    const forms = (await db.collection('forms').find({}).toArray()).map((item) => toForm(item, questionMap));
    const latestSummaries = await db.collection('summaries').aggregate([
      { $sort: { createdAt: -1, _id: -1 } }, { $group: { _id: '$CENTRO_ID', summary: { $first: '$$ROOT' } } },
    ]).toArray();
    const latestFormByCentro = new Map<string, string>(latestSummaries.map(({ summary }) => [
      String(summary.CENTRO_ID), stringId(summary.FORM_ID),
    ]));
    const { assignments, report: answerReport } = answerMetadata(forms, answers, latestFormByCentro);
    const unresolvedLatestSummaryAnswers = answers
      .filter((answer) => latestFormByCentro.has(String(answer.CENTRO_ID)) && !assignments.has(stringId(answer._id)))
      .map((answer) => stringId(answer._id));
    const answersOutsideLatestSummaryForm = answers
      .filter((answer) => {
        const latestForm = latestFormByCentro.get(String(answer.CENTRO_ID));
        const assignment = assignments.get(stringId(answer._id));
        return latestForm && String(assignment?.FORM_ID || '') !== latestForm;
      })
      .map((answer) => stringId(answer._id));
    const report = {
      ...answerReport,
      unresolvedLatestSummaryAnswers,
      answersOutsideLatestSummaryForm,
      ...attendanceDiagnostics(forms, answers, assignments),
    };
    const manifest = {
      runId: args.runId,
      database: db.databaseName,
      journals: { answers: journalName, summaries: summaryJournalName },
      before: identity,
      metadataUpdates: assignments.size,
    };
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    await writeFile(reportPath, JSON.stringify(report, null, 2));
    if (args.mode === 'dry-run') {
      console.log(JSON.stringify({
        mode: args.mode,
        manifestPath,
        reportPath,
        updates: assignments.size,
        diagnostics: {
          orphanAnswers: report.orphanAnswers.length,
          ambiguousAnswers: report.ambiguousAnswers.length,
          summaryFormMismatches: report.summaryFormMismatches.length,
          unresolvedLatestSummaryAnswers: report.unresolvedLatestSummaryAnswers.length,
          answersOutsideLatestSummaryForm: report.answersOutsideLatestSummaryForm.length,
          invalidDays: report.invalidDays.length,
          missingTimes: report.missingTimes.length,
        },
      }));
      return;
    }

    const journal = db.collection(journalName);
    await journal.createIndex({ 'original._id': 1 }, { unique: true });
    if (answers.length) await journal.insertMany(answers.map((original) => ({ original: BSON.deserialize(BSON.serialize(original)) })), { ordered: false });
    const operations = answers.flatMap((answer) => {
      const metadata = assignments.get(stringId(answer._id));
      return metadata ? [{ updateOne: { filter: { _id: answer._id }, update: { $set: metadata } } }] : [];
    });
    if (operations.length) await answersCollection.bulkWrite(operations, { ordered: false });

    const updatedAnswers = await answersCollection.find({}).toArray();
    const after = { count: updatedAnswers.length, ids: updatedAnswers.map((item) => stringId(item._id)).sort(), coreHash: coreHash(updatedAnswers) };
    if (identity.count !== after.count || identity.coreHash !== after.coreHash || JSON.stringify(identity.ids) !== JSON.stringify(after.ids)) {
      throw new Error('Reconciliação pós-Answers falhou. Execute rollback com o mesmo run-id.');
    }

    const formsById = new Map(forms.map((form) => [form.id, form]));
    const summaryJournal = db.collection(summaryJournalName);
    await summaryJournal.createIndex({ 'original._id': 1 }, { unique: true });
    if (latestSummaries.length) {
      await summaryJournal.insertMany(latestSummaries.map(({ summary }) => ({
        original: BSON.deserialize(BSON.serialize(summary)),
      })), { ordered: false });
    }
    let summariesUpdated = 0;
    for (const entry of latestSummaries) {
      const summary = entry.summary;
      const form = formsById.get(stringId(summary.FORM_ID));
      if (!form) continue;
      const allCenterAnswers = updatedAnswers.filter((answer) => String(answer.CENTRO_ID) === String(summary.CENTRO_ID));
      const centerAnswers = allCenterAnswers.filter((answer) => String(answer.FORM_ID) === form.id).map(toAnswer);
      const snapshot = buildFormSnapshot(form, centerAnswers);
      const representedIds = new Set(flattenSnapshot(snapshot)
        .map((item) => item.answerId)
        .filter((id): id is string => id !== undefined));
      appendUnresolvedAnswers(
        snapshot,
        allCenterAnswers.filter((answer) => !representedIds.has(stringId(answer._id))),
        questionMap,
        String(summary.CENTRO_ID),
      );
      const expectedAnswerIds = allCenterAnswers.map((answer) => stringId(answer._id)).sort();
      const snapshotAnswerIds = flattenSnapshot(snapshot)
        .map((item) => item.answerId)
        .filter((id): id is string => id !== undefined)
        .sort();
      if (JSON.stringify(expectedAnswerIds) !== JSON.stringify(snapshotAnswerIds)) {
        const expectedSet = new Set(expectedAnswerIds);
        const snapshotSet = new Set(snapshotAnswerIds);
        const missingIds = expectedAnswerIds.filter((id) => !snapshotSet.has(id));
        const unexpected = snapshotAnswerIds.filter((id) => !expectedSet.has(id)).length;
        const duplicates = snapshotAnswerIds.length - snapshotSet.size;
        throw new Error(
          `Summary ${stringId(summary._id)} não representa exatamente todos os Answers do centro ` +
          `(esperados=${expectedAnswerIds.length}, snapshot=${snapshotAnswerIds.length}, ausentes=${missingIds.length}, ` +
          `inesperados=${unexpected}, duplicados=${duplicates}, primeiroAusente=${missingIds[0] ?? 'nenhum'}, ` +
          `representadoAntes=${representedIds.has(missingIds[0])}).`,
        );
      }
      await db.collection('summaries').updateOne({ _id: summary._id }, { $set: {
        schemaVersion: 2, FORM_SNAPSHOT: snapshot, QUESTIONS: flattenSnapshot(snapshot).map((item) => ({
          QUESTION: item.questionId, ANSWER: item.answer, ANSWER_ID: item.answerId, GROUP_KEY: item.groupKey,
          GROUP_INSTANCE_ID: item.groupInstanceId, OCCURRENCE_ORDER: item.occurrenceOrder,
          QUESTION_ORDER: item.questionOrder, QUESTION_LABEL: item.questionLabel, ANSWER_TYPE: item.answerType,
        })), ATENDIMENTOS: deriveAttendance(snapshot), DIVULGACAO_AUTORIZADA: derivePublicationAuthorization(snapshot),
        reconstruction: { source: 'current_answers', historicalIntegrity: 'approximate' },
      } });
      summariesUpdated += 1;
    }
    await writeFile(manifestPath, JSON.stringify({ ...manifest, after, summariesUpdated, completedAt: new Date().toISOString() }, null, 2));
    console.log(JSON.stringify({
      mode: args.mode,
      updates: operations.length,
      summariesUpdated,
      reconciled: true,
      manifestPath,
      reportPath,
      journals: [journalName, summaryJournalName],
    }));
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

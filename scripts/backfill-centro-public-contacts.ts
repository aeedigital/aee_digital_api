import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Document, MongoClient, ObjectId } from 'mongodb';

type Mode = 'dry-run' | 'apply' | 'verify' | 'rollback';

type Args = {
  mode: Mode;
  uri: string;
  dbName?: string;
  runId: string;
  outputDir: string;
};

type PublicContact = {
  TELEFONE?: string;
  SITE?: string;
};

const AUTHORIZATION_QUESTION_ID = '659467a52f490be057cc4341';
const PHONE_QUESTION_ID = '61df432fdf23b90014a944b0';
const SITE_QUESTION_ID = '61df432fdf23b90014a944b3';

function parseArgs(): Args {
  const values = process.argv.slice(2);
  const mode = values[0] as Mode;
  if (!['dry-run', 'apply', 'verify', 'rollback'].includes(mode)) {
    throw new Error(
      'Uso: backfill-centro-public-contacts.ts <dry-run|apply|verify|rollback> ' +
        '--uri-env NOME [--db DB] [--run-id ID] [--output-dir DIR]',
    );
  }
  const option = (name: string) => {
    const index = values.indexOf(name);
    return index >= 0 ? values[index + 1] : undefined;
  };
  const uriEnvironment = option('--uri-env');
  if (!uriEnvironment || !process.env[uriEnvironment]) {
    throw new Error(
      '--uri-env deve apontar explicitamente para uma variável contendo a URI MongoDB.',
    );
  }
  return {
    mode,
    uri: process.env[uriEnvironment] as string,
    dbName: option('--db'),
    runId:
      option('--run-id') || new Date().toISOString().replace(/[-:.TZ]/g, ''),
    outputDir: resolve(
      option('--output-dir') || '.maintenance/centro-public-contacts',
    ),
  };
}

function stringId(value: unknown): string {
  return String((value as Document)?._id ?? value ?? '');
}

function normalize(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

function answer(summary: Document, questionId: string): string | undefined {
  const matching = (summary.QUESTIONS || []).filter(
    (item: Document) => stringId(item.QUESTION) === questionId,
  );
  const value = matching.at(-1)?.ANSWER;
  return value === undefined || value === null ? undefined : String(value);
}

function isAuthorized(summary?: Document): boolean {
  if (!summary) return false;
  if (typeof summary.DIVULGACAO_AUTORIZADA === 'boolean') {
    return summary.DIVULGACAO_AUTORIZADA;
  }
  return ['TRUE', 'SIM', 'S', '1'].includes(
    normalize(answer(summary, AUTHORIZATION_QUESTION_ID)),
  );
}

function publicValue(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return ['FALSE', 'NAN', 'NAO SE APLICA'].includes(normalize(trimmed))
    ? undefined
    : trimmed;
}

function expectedContact(summary?: Document): PublicContact {
  if (!isAuthorized(summary)) return {};
  const telefone = publicValue(answer(summary!, PHONE_QUESTION_ID));
  const site = publicValue(answer(summary!, SITE_QUESTION_ID));
  return {
    ...(telefone ? { TELEFONE: telefone } : {}),
    ...(site ? { SITE: site } : {}),
  };
}

function differs(centro: Document, expected: PublicContact): boolean {
  return (
    centro.TELEFONE !== expected.TELEFONE || centro.SITE !== expected.SITE
  );
}

function contactUpdate(expected: PublicContact) {
  return {
    $set: {
      ...(expected.TELEFONE ? { TELEFONE: expected.TELEFONE } : {}),
      ...(expected.SITE ? { SITE: expected.SITE } : {}),
    },
    $unset: {
      ...(expected.TELEFONE ? {} : { TELEFONE: '' }),
      ...(expected.SITE ? {} : { SITE: '' }),
    },
  };
}

async function main() {
  const args = parseArgs();
  await mkdir(args.outputDir, { recursive: true });
  const manifestPath = resolve(args.outputDir, `${args.runId}.manifest.json`);
  const journalName = `_centro_public_contacts_journal_${args.runId}`;
  const client = new MongoClient(args.uri);
  await client.connect();
  const db = args.dbName ? client.db(args.dbName) : client.db();
  const centrosCollection = db.collection('centros');

  try {
    if (args.mode === 'rollback') {
      const journal = await db.collection(journalName).find({}).toArray();
      if (!journal.length) {
        throw new Error(`Journal ${journalName} não encontrado ou vazio.`);
      }
      const operations = journal.map((item) => ({
        updateOne: {
          filter: { _id: item.centroId },
          update: {
            $set: {
              ...(item.telefoneExists ? { TELEFONE: item.telefone } : {}),
              ...(item.siteExists ? { SITE: item.site } : {}),
            },
            $unset: {
              ...(item.telefoneExists ? {} : { TELEFONE: '' }),
              ...(item.siteExists ? {} : { SITE: '' }),
            },
          },
        },
      }));
      await centrosCollection.bulkWrite(operations, { ordered: false });
      console.log(
        JSON.stringify({ mode: args.mode, restored: operations.length, journalName }),
      );
      return;
    }

    const [centros, latestSummaryReferences] = await Promise.all([
      centrosCollection
        .find({}, { projection: { TELEFONE: 1, SITE: 1 } })
        .toArray(),
      db
        .collection('summaries')
        .aggregate<{ _id: unknown; summaryId: ObjectId }>([
          { $project: { CENTRO_ID: 1, createdAt: 1, updatedAt: 1 } },
          { $sort: { CENTRO_ID: 1, updatedAt: -1, createdAt: -1, _id: -1 } },
          {
            $group: {
              _id: '$CENTRO_ID',
              summaryId: { $first: '$_id' },
            },
          },
        ])
        .toArray(),
    ]);
    const latestSummaries = await db
      .collection('summaries')
      .find(
        {
          _id: {
            $in: latestSummaryReferences.map((item) => item.summaryId),
          },
        },
        {
          projection: {
            CENTRO_ID: 1,
            QUESTIONS: 1,
            DIVULGACAO_AUTORIZADA: 1,
          },
        },
      )
      .toArray();
    const summariesByCentro = new Map(
      latestSummaries.map((item) => [stringId(item.CENTRO_ID), item]),
    );
    const expectedByCentro = new Map(
      centros.map((centro) => [
        stringId(centro._id),
        expectedContact(summariesByCentro.get(stringId(centro._id))),
      ]),
    );
    const changed = centros.filter((centro) =>
      differs(centro, expectedByCentro.get(stringId(centro._id)) || {}),
    );
    const summary = {
      mode: args.mode,
      database: db.databaseName,
      centros: centros.length,
      changed: changed.length,
      withPhone: [...expectedByCentro.values()].filter((item) => item.TELEFONE)
        .length,
      withSite: [...expectedByCentro.values()].filter((item) => item.SITE).length,
      journalName,
    };

    if (args.mode === 'dry-run') {
      await writeFile(manifestPath, JSON.stringify(summary, null, 2));
      console.log(JSON.stringify({ ...summary, manifestPath }));
      return;
    }

    if (args.mode === 'verify') {
      if (changed.length) {
        throw new Error(
          `Verificação falhou: ${changed.length} centros possuem contatos divergentes.`,
        );
      }
      console.log(JSON.stringify({ ...summary, valid: true }));
      return;
    }

    const journal = db.collection(journalName);
    await journal.createIndex({ centroId: 1 }, { unique: true });
    if (centros.length) {
      await journal.insertMany(
        centros.map((centro) => ({
          centroId: centro._id,
          telefoneExists: Object.prototype.hasOwnProperty.call(
            centro,
            'TELEFONE',
          ),
          telefone: centro.TELEFONE,
          siteExists: Object.prototype.hasOwnProperty.call(centro, 'SITE'),
          site: centro.SITE,
        })),
        { ordered: false },
      );
    }
    const operations = changed.map((centro) => ({
      updateOne: {
        filter: { _id: centro._id },
        update: contactUpdate(
          expectedByCentro.get(stringId(centro._id)) || {},
        ),
      },
    }));
    if (operations.length) {
      await centrosCollection.bulkWrite(operations, { ordered: false });
    }
    const after = await centrosCollection
      .find({}, { projection: { TELEFONE: 1, SITE: 1 } })
      .toArray();
    const divergences = after.filter((centro) =>
      differs(centro, expectedByCentro.get(stringId(centro._id)) || {}),
    );
    if (divergences.length) {
      throw new Error(
        `Reconciliação falhou em ${divergences.length} centros. Execute rollback com run-id ${args.runId}.`,
      );
    }
    await writeFile(
      manifestPath,
      JSON.stringify(
        { ...summary, applied: operations.length, reconciled: true },
        null,
        2,
      ),
    );
    console.log(
      JSON.stringify({
        ...summary,
        applied: operations.length,
        reconciled: true,
        manifestPath,
      }),
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

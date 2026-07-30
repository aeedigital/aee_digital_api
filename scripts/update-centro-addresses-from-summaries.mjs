import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE_URL = (
  process.env.API_BASE_URL
  || 'https://vf7xhmyixb.execute-api.us-east-1.amazonaws.com/prod/'
).replace(/\/+$/, '');
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const cacheFilePath = process.env.FORM_QUESTION_CACHE_FILE?.trim()
  ? path.resolve(process.env.FORM_QUESTION_CACHE_FILE.trim())
  : path.resolve(scriptDirectory, 'update-centro-address-question-ids.json');

// Informe ALL_CENTROS=true para atualizar todos os centros.
// Como alternativa, informe REGIONAL_ID ou preencha/informe CENTRO_IDS=id1,id2.
const CENTRO_IDS = [
  '670db9c0de561168547206e1',
];

const allCentros = process.env.ALL_CENTROS === 'true';
const regionalId = process.env.REGIONAL_ID?.trim();
const configuredCentroIds = process.env.CENTRO_IDS
  ? process.env.CENTRO_IDS.split(',').map((id) => id.trim()).filter(Boolean)
  : CENTRO_IDS;
const sourceDescription = allCentros
  ? 'todos os centros'
  : regionalId
    ? `regional ${regionalId}`
    : 'CENTRO_IDS';

const dryRun = process.env.DRY_RUN !== 'false';
const authorization = process.env.API_TOKEN
  ? { Authorization: `Bearer ${process.env.API_TOKEN}` }
  : {};

if (!allCentros && !regionalId && !configuredCentroIds.length) {
  throw new Error(
    'Informe ALL_CENTROS=true, REGIONAL_ID, ao menos um id em CENTRO_IDS '
      + 'ou preencha o array CENTRO_IDS do script.',
  );
}

function isValidCache(cache) {
  return (
    cache !== null
    && typeof cache === 'object'
    && !Array.isArray(cache)
    && Object.entries(cache).every(
      ([formId, questionId]) => Boolean(
        formId.trim() && typeof questionId === 'string' && questionId.trim(),
      ),
    )
  );
}

async function loadAddressQuestionCache() {
  let content;

  console.log(`[cache] Carregando ${cacheFilePath}`);

  try {
    content = await readFile(cacheFilePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('[cache] Arquivo ainda não existe; iniciando cache vazio.');
      return {};
    }

    throw new Error(`Não foi possível ler o cache ${cacheFilePath}: ${error.message}`);
  }

  let cache;

  try {
    cache = JSON.parse(content);
  } catch (error) {
    throw new Error(`O cache ${cacheFilePath} contém JSON inválido: ${error.message}`);
  }

  if (!isValidCache(cache)) {
    throw new Error(
      `O cache ${cacheFilePath} deve ser um objeto no formato { "formId": "questionId" }.`,
    );
  }

  console.log(`[cache] ${Object.keys(cache).length} formulário(s) carregado(s).`);
  return cache;
}

async function saveAddressQuestionCache(cache) {
  const temporaryFilePath = `${cacheFilePath}.${process.pid}.tmp`;
  const content = `${JSON.stringify(cache, null, 2)}\n`;

  try {
    await mkdir(path.dirname(cacheFilePath), { recursive: true });
    await writeFile(temporaryFilePath, content, 'utf8');
    await rename(temporaryFilePath, cacheFilePath);
    console.log(
      `[cache] Salvo em ${cacheFilePath} com ${Object.keys(cache).length} formulário(s).`,
    );
  } catch (error) {
    throw new Error(`Não foi possível salvar o cache ${cacheFilePath}: ${error.message}`);
  }
}

const addressQuestionCache = await loadAddressQuestionCache();

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...authorization,
      ...options.headers,
    },
  });

  const text = await response.text();
  let payload;

  try {
    payload = text ? JSON.parse(text) : undefined;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    throw new Error(
      `${options.method || 'GET'} ${path} retornou ${response.status}: ${JSON.stringify(payload)}`,
    );
  }

  return payload;
}

function normalizeQuestionLabel(label) {
  return String(label ?? '').trim().normalize('NFC').toLocaleLowerCase('pt-BR');
}

function findAddressQuestionId(form) {
  for (const page of form?.PAGES || []) {
    for (const quiz of page?.QUIZES || []) {
      for (const questionGroup of quiz?.QUESTIONS || []) {
        for (const question of questionGroup?.GROUP || []) {
          if (normalizeQuestionLabel(question?.QUESTION) === 'endereço') {
            const questionId = String(question?._id ?? '').trim();

            if (questionId) {
              return questionId;
            }
          }
        }
      }
    }
  }

  return undefined;
}

async function getAddressQuestionId(summary) {
  const formId = String(summary?.FORM_ID ?? '').trim();

  if (!formId) {
    console.log('[form] Summary mais recente sem FORM_ID.');
    return { reason: 'FORM_ID ausente no summary mais recente' };
  }

  if (Object.hasOwn(addressQuestionCache, formId)) {
    console.log(
      `[cache] Hit para formulário ${formId}: questão ${addressQuestionCache[formId]}.`,
    );
    return { formId, questionId: addressQuestionCache[formId] };
  }

  console.log(`[cache] Miss para formulário ${formId}.`);
  console.log(`[form] Buscando /forms/${formId}`);
  const form = await request(`/forms/${formId}`);
  const questionId = findAddressQuestionId(form);

  if (!questionId) {
    console.log(`[form] Questão "Endereço" não encontrada no formulário ${formId}.`);
    return {
      formId,
      reason: `nenhuma questão "Endereço" encontrada no formulário ${formId}`,
    };
  }

  console.log(`[form] Questão "Endereço" encontrada: ${questionId}.`);
  const updatedCache = { ...addressQuestionCache, [formId]: questionId };
  await saveAddressQuestionCache(updatedCache);
  addressQuestionCache[formId] = questionId;

  return { formId, questionId };
}

async function getAddressFromLatestSummary(summaries) {
  if (!Array.isArray(summaries) || summaries.length === 0) {
    console.log('[summary] Nenhum summary encontrado.');
    return { reason: 'nenhum summary encontrado' };
  }

  // O endpoint usa updatedAt desc como ordenação padrão no repositório Mongo.
  const latestSummary = summaries[0];
  console.log(
    `[summary] ${summaries.length} encontrado(s); usando o mais recente: ${latestSummary._id}.`,
  );
  const questionResult = await getAddressQuestionId(latestSummary);

  if (!questionResult.questionId) {
    return {
      formId: questionResult.formId,
      summaryId: latestSummary._id,
      reason: questionResult.reason,
    };
  }

  const item = latestSummary.QUESTIONS?.find(
    (question) => String(question.QUESTION) === questionResult.questionId,
  );
  const address = String(item?.ANSWER ?? '').trim();

  if (!item) {
    console.log(
      `[summary] Questão ${questionResult.questionId} não está presente no summary mais recente.`,
    );
    return {
      formId: questionResult.formId,
      summaryId: latestSummary._id,
      reason: `questão de endereço ${questionResult.questionId} ausente no summary mais recente`,
    };
  }

  if (!address) {
    console.log('[summary] A resposta da questão de endereço está vazia.');
    return {
      formId: questionResult.formId,
      summaryId: latestSummary._id,
      reason: 'resposta de endereço vazia no summary mais recente',
    };
  }

  console.log(`[summary] Endereço recuperado usando a questão ${questionResult.questionId}.`);
  return {
    address,
    formId: questionResult.formId,
    questionId: questionResult.questionId,
    summaryId: latestSummary._id,
  };
}

function toUpdatePayload(centro, address) {
  return {
    FUNCIONAMENTO: centro.FUNCIONAMENTO,
    NOME_CENTRO: centro.NOME_CENTRO,
    NOME_CURTO: centro.NOME_CURTO,
    CNPJ_CENTRO: centro.CNPJ_CENTRO,
    DATA_FUNDACAO: centro.DATA_FUNDACAO,
    REGIONAL: centro.REGIONAL,
    ENDERECO: address,
    CEP: centro.CEP,
    BAIRRO: centro.BAIRRO,
    CIDADE: centro.CIDADE,
    ESTADO: centro.ESTADO,
    PAIS: centro.PAIS,
  };
}

async function getCentros() {
  if (allCentros) {
    console.log('[centros] Buscando a lista completa de centros.');
    const centros = await request('/centros');

    if (!Array.isArray(centros)) {
      throw new Error('O endpoint /centros retornou uma lista inválida.');
    }

    console.log(`[centros] ${centros.length} centro(s) encontrado(s).`);
    return centros;
  }

  if (regionalId) {
    console.log(`[centros] Buscando centros da regional ${regionalId}.`);
    const centros = await request(`/regionais/${regionalId}/centros`);

    if (!Array.isArray(centros)) {
      throw new Error(`A regional ${regionalId} retornou uma lista de centros inválida.`);
    }

    console.log(`[centros] ${centros.length} centro(s) encontrado(s) na regional.`);
    return centros;
  }

  console.log(`[centros] Buscando ${configuredCentroIds.length} centro(s) configurado(s).`);
  const centros = await Promise.all(
    configuredCentroIds.map((centroId) => request(`/centros/${centroId}`)),
  );
  console.log(`[centros] ${centros.length} centro(s) recuperado(s).`);
  return centros;
}

async function updateCentroAddress(centro) {
  const centroId = String(centro?._id ?? '').trim();

  if (!centroId) {
    return { centroId: null, status: 'erro', detail: 'centro sem _id' };
  }

  console.log(`[centro ${centroId}] Buscando summaries.`);
  const summaries = await request(`/centros/${centroId}/summaries`);
  const result = await getAddressFromLatestSummary(summaries);

  if (!result.address) {
    return {
      centroId,
      status: 'ignorado',
      detail: result.reason,
      formId: result.formId,
      summaryId: result.summaryId,
    };
  }

  const currentAddress = String(centro.ENDERECO ?? '').trim();

  if (currentAddress === result.address) {
    console.log(`[centro ${centroId}] O endereço já está atualizado.`);
    return {
      centroId,
      status: 'sem alteração',
      address: result.address,
      formId: result.formId,
      questionId: result.questionId,
      summaryId: result.summaryId,
    };
  }

  if (dryRun) {
    console.log(`[centro ${centroId}] Simulação concluída; nenhum PATCH será enviado.`);
    return {
      centroId,
      status: 'simulação',
      from: currentAddress,
      to: result.address,
      formId: result.formId,
      questionId: result.questionId,
      summaryId: result.summaryId,
    };
  }

  console.log(`[centro ${centroId}] Enviando atualização de endereço.`);
  await request(`/centros/${centroId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toUpdatePayload(centro, result.address)),
  });
  console.log(`[centro ${centroId}] Endereço atualizado com sucesso.`);

  return {
    centroId,
    status: 'atualizado',
    from: currentAddress,
    to: result.address,
    formId: result.formId,
    questionId: result.questionId,
    summaryId: result.summaryId,
  };
}

const results = [];
let centros;

console.log(
  `[início] Origem: ${sourceDescription}; modo: ${
    dryRun ? 'simulação' : 'alteração'
  }.`,
);

try {
  centros = await getCentros();
} catch (error) {
  console.error({
    allCentros,
    regionalId: regionalId || undefined,
    status: 'erro',
    detail: error.message,
  });
  process.exitCode = 1;
  centros = [];
}

for (const centro of centros) {
  const centroId = String(centro?._id ?? '').trim() || null;

  console.log(
    `\n[progresso] Processando centro ${results.length + 1}/${centros.length}: ${centroId}`,
  );

  try {
    const result = await updateCentroAddress(centro);
    results.push(result);
    console.log(result);
  } catch (error) {
    const result = { centroId, status: 'erro', detail: error.message };
    results.push(result);
    console.error(result);
  }
}

const errors = results.filter((result) => result.status === 'erro');
console.log(
  `Processados: ${results.length}; erros: ${errors.length}; origem: ${sourceDescription}; modo: ${
    dryRun ? 'simulação' : 'alteração'
  }.`,
);

if (errors.length) {
  process.exitCode = 1;
}

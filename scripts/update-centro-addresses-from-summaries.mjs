const API_BASE_URL = (
  process.env.API_BASE_URL
  || 'https://vf7xhmyixb.execute-api.us-east-1.amazonaws.com/prod/'
).replace(/\/+$/, '');
const QUESTION_ID = '61df432fdf23b90014a944b8';

// Preencha este array ou informe CENTRO_IDS=id1,id2 ao executar o script.
const CENTRO_IDS = [
  '670db9c0de561168547206e1',
];

const centroIds = process.env.CENTRO_IDS
  ? process.env.CENTRO_IDS.split(',').map((id) => id.trim()).filter(Boolean)
  : CENTRO_IDS;

const dryRun = process.env.DRY_RUN !== 'false';
const authorization = process.env.API_TOKEN
  ? { Authorization: `Bearer ${process.env.API_TOKEN}` }
  : {};

if (!centroIds.length) {
  throw new Error('Informe ao menos um id em CENTRO_IDS ou no array CENTRO_IDS do script.');
}

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

function getAddressFromLatestSummary(summaries) {
  if (!Array.isArray(summaries) || summaries.length === 0) {
    return { reason: 'nenhum summary encontrado' };
  }

  // O endpoint usa updatedAt desc como ordenação padrão no repositório Mongo.
  const latestSummary = summaries[0];
  const item = latestSummary.QUESTIONS?.find(
    (question) => String(question.QUESTION) === QUESTION_ID,
  );
  const address = String(item?.ANSWER ?? '').trim();

  if (!item) {
    return {
      summaryId: latestSummary._id,
      reason: `questão ${QUESTION_ID} ausente no summary mais recente`,
    };
  }

  if (!address) {
    return {
      summaryId: latestSummary._id,
      reason: 'resposta de endereço vazia no summary mais recente',
    };
  }

  return { address, summaryId: latestSummary._id };
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

async function updateCentroAddress(centroId) {
  const summaries = await request(`/centros/${centroId}/summaries`);
  const result = getAddressFromLatestSummary(summaries);

  if (!result.address) {
    return { centroId, status: 'ignorado', detail: result.reason, summaryId: result.summaryId };
  }

  const centro = await request(`/centros/${centroId}`);
  const currentAddress = String(centro.ENDERECO ?? '').trim();

  if (currentAddress === result.address) {
    return {
      centroId,
      status: 'sem alteração',
      address: result.address,
      summaryId: result.summaryId,
    };
  }

  if (dryRun) {
    return {
      centroId,
      status: 'simulação',
      from: currentAddress,
      to: result.address,
      summaryId: result.summaryId,
    };
  }

  await request(`/centros/${centroId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toUpdatePayload(centro, result.address)),
  });

  return {
    centroId,
    status: 'atualizado',
    from: currentAddress,
    to: result.address,
    summaryId: result.summaryId,
  };
}

const results = [];

for (const centroId of centroIds) {
  try {
    const result = await updateCentroAddress(centroId);
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
  `Processados: ${results.length}; erros: ${errors.length}; modo: ${dryRun ? 'simulação' : 'alteração'}.`,
);

if (errors.length) {
  process.exitCode = 1;
}

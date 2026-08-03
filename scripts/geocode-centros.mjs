import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';

const apiBaseUrl = (process.env.API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');
const geoapifyApiKey = process.env.GEOAPIFY_API_KEY?.trim();
const operationalToken = process.env.LOCATION_UPDATE_TOKEN?.trim();
const dryRun = process.env.DRY_RUN !== 'false';
const force = process.env.FORCE === 'true';
const regionalId = process.env.REGIONAL_ID?.trim();
const allCentros = process.env.ALL_CENTROS === 'true';
const centroIds = (process.env.CENTRO_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);
const concurrency = positiveInteger(process.env.CONCURRENCY, 1);
const intervalMs = positiveInteger(process.env.INTERVAL_MS, 300);
const timeoutMs = positiveInteger(process.env.GEOCODING_TIMEOUT_MS, 15000);
const maxCalls = positiveInteger(process.env.MAX_CALLS, 2800);
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const reportPrefix = process.env.REPORT_PREFIX?.trim() || `geocoding-report-${timestamp}`;

const addressFields = ['ENDERECO', 'CEP', 'BAIRRO', 'CIDADE', 'ESTADO', 'PAIS'];
const invalidAddressValues = new Set([
  '',
  '-',
  'n/a',
  'nao informado',
  'não informado',
  'sem endereco',
  'sem endereço',
  '(sem endereco)',
  '(sem endereço)',
]);
const countryCodes = {
  alemanha: 'de',
  germany: 'de',
  argentina: 'ar',
  australia: 'au',
  austrália: 'au',
  brasil: 'br',
  brazil: 'br',
  canada: 'ca',
  canadá: 'ca',
  cuba: 'cu',
  'estados unidos': 'us',
  portugal: 'pt',
  'united states': 'us',
  'united states of america': 'us',
};

function log(scope, message) {
  console.log(`${new Date().toISOString()} [${scope}] ${message}`);
}

function itemScope(item, index, total) {
  const position = index === undefined ? '?' : index + 1;
  return `centro ${position}/${total ?? '?'} ${item.centro._id}`;
}

function oneLine(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function formatAddress(address) {
  return [
    address.ENDERECO,
    address.BAIRRO,
    `${address.CIDADE}/${address.ESTADO}`,
    address.CEP,
    address.PAIS,
  ]
    .map(oneLine)
    .filter(Boolean)
    .join(', ');
}

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('pt-BR');
}

function toAddress(centro) {
  return Object.fromEntries(addressFields.map((field) => [field, String(centro?.[field] ?? '').trim()]));
}

function hashAddress(address) {
  const canonical = addressFields.map((field) => `${field}:${normalize(address[field])}`).join('|');
  return createHash('sha256').update(canonical).digest('hex');
}

function hasSufficientAddress(address) {
  return [address.ENDERECO, address.CIDADE, address.PAIS].every(
    (value) => !invalidAddressValues.has(normalize(value)),
  );
}

function matchesText(expected, candidates) {
  const normalizedExpected = normalize(expected);
  if (!normalizedExpected) return true;

  return candidates.map(normalize).filter(Boolean).some(
    (candidate) =>
      candidate === normalizedExpected ||
      (candidate.length > 3 &&
        normalizedExpected.length > 3 &&
        (candidate.includes(normalizedExpected) || normalizedExpected.includes(candidate))),
  );
}

function matchesAdministrativeArea(expected, candidates) {
  return matchesText(expected, candidates.flatMap((candidate) => [candidate, String(candidate ?? '').split('-').pop()]));
}

function countryCode(value) {
  const normalized = normalize(value);
  if (/^[a-z]{2}$/.test(normalized)) return normalized;
  return countryCodes[normalized];
}

function matchesCountry(expected, candidates) {
  const expectedCode = countryCode(expected);
  const candidateCodes = candidates.map(countryCode).filter(Boolean);
  return expectedCode && candidateCodes.length
    ? candidateCodes.includes(expectedCode)
    : matchesText(expected, candidates);
}

function matchesPostcode(expected, actual) {
  const expectedDigits = String(expected ?? '').replace(/\D/g, '');
  const actualDigits = String(actual ?? '').replace(/\D/g, '');
  if (!expectedDigits) return true;
  if (!actualDigits) return false;
  return expectedDigits === actualDigits || expectedDigits.startsWith(actualDigits) || actualDigits.startsWith(expectedDigits);
}

function assessConfirmation(address, result) {
  const addressHasNumber = /\d/.test(address.ENDERECO);
  const checks = [
    ['match_type diferente de full_match', result.matchType === 'full_match'],
    ['confiança geral abaixo de 0.95', result.confidence >= 0.95],
    [
      'confiança de prédio ausente ou abaixo de 0.95',
      !addressHasNumber || (result.confidenceBuilding ?? 0) >= 0.95,
    ],
    ['cidade divergente', matchesText(address.CIDADE, [result.city])],
    [
      'estado divergente',
      matchesAdministrativeArea(address.ESTADO, [
        result.state,
        result.stateCode,
        result.county,
        result.countyCode,
      ]),
    ],
    [
      'país divergente',
      matchesCountry(address.PAIS, [result.country, result.countryCode]),
    ],
    ['CEP divergente ou ausente', matchesPostcode(address.CEP, result.postcode)],
  ];
  const rejectionReasons = checks
    .filter(([, passed]) => !passed)
    .map(([reason]) => reason);
  return { confirmed: rejectionReasons.length === 0, rejectionReasons };
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
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
    const error = new Error(
      `${options.method || 'GET'} ${path} retornou ${response.status}: ${JSON.stringify(payload)}`,
    );
    error.code = `API_HTTP_${response.status}`;
    throw error;
  }

  return payload;
}

async function loadCentros() {
  if (regionalId) {
    return apiRequest(`/regionais/${encodeURIComponent(regionalId)}/centros`);
  }
  if (centroIds.length) {
    return Promise.all(centroIds.map((id) => apiRequest(`/centros/${encodeURIComponent(id)}`)));
  }
  if (!allCentros) {
    throw new Error('Informe REGIONAL_ID, CENTRO_IDS ou ALL_CENTROS=true explicitamente.');
  }
  return apiRequest('/centros');
}

let scheduleQueue = Promise.resolve();
let lastRequestStartedAt = 0;
let geoapifyCalls = 0;

async function waitForProviderSlot() {
  let release;
  const previous = scheduleQueue;
  scheduleQueue = new Promise((resolve) => {
    release = resolve;
  });
  await previous;

  const elapsed = Date.now() - lastRequestStartedAt;
  const waitMs = Math.max(0, intervalMs - elapsed);
  if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
  lastRequestStartedAt = Date.now();
  release();
}

function geoapifyUrl(address) {
  const params = new URLSearchParams({
    street: address.ENDERECO,
    city: address.CIDADE,
    country: address.PAIS,
    format: 'json',
    limit: '1',
    apiKey: geoapifyApiKey,
  });
  if (address.CEP) params.set('postcode', address.CEP);
  if (address.ESTADO) params.set('state', address.ESTADO);
  if (address.BAIRRO) params.set('suburb', address.BAIRRO);
  return `https://api.geoapify.com/v1/geocode/search?${params.toString()}`;
}

async function geocode(address) {
  await waitForProviderSlot();
  if (geoapifyCalls >= maxCalls) {
    const error = new Error(`Limite operacional de ${maxCalls} chamadas atingido`);
    error.code = 'LIMITE_OPERACIONAL';
    throw error;
  }
  geoapifyCalls += 1;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(geoapifyUrl(address), {
      headers: { Accept: 'application/json', 'User-Agent': 'aee-digital-geocoding-script/1.0' },
      signal: controller.signal,
    });
    if (response.status === 429) {
      const error = new Error('Cota ou limite do Geoapify atingido');
      error.code = 'RATE_LIMIT';
      throw error;
    }
    if (!response.ok) {
      const error = new Error(`Geoapify retornou HTTP ${response.status}`);
      error.code = `HTTP_${response.status}`;
      throw error;
    }

    const payload = await response.json();
    const item = payload.results?.[0];
    if (!item || typeof item.lat !== 'number' || typeof item.lon !== 'number') return null;

    return {
      latitude: item.lat,
      longitude: item.lon,
      formattedAddress: item.formatted ?? '',
      placeId: item.place_id,
      resultType: item.result_type,
      confidence: item.rank?.confidence ?? 0,
      confidenceBuilding: item.rank?.confidence_building_level,
      matchType: item.rank?.match_type,
      city: item.city,
      state: item.state,
      stateCode: item.state_code,
      county: item.county,
      countyCode: item.county_code,
      country: item.country,
      countryCode: item.country_code,
      postcode: item.postcode,
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error(
        `Geoapify excedeu o timeout de ${timeoutMs}ms`,
      );
      timeoutError.code = 'TIMEOUT';
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function saveLocation(centroId, location) {
  return apiRequest(`/centros/${encodeURIComponent(centroId)}/localizacao`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-location-update-token': operationalToken,
    },
    body: JSON.stringify(location),
  });
}

async function validateLocationEndpoint() {
  const path = '/centros/preflight/localizacao';
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-location-update-token': operationalToken,
    },
    body: '{}',
  });
  if (response.status === 400) {
    log('preflight', 'Rota operacional de localização disponível e token aceito.');
    return;
  }

  const body = await response.text();
  const error = new Error(
    `Preflight da rota de localização retornou ${response.status}: ${body}`,
  );
  error.code = `API_PREFLIGHT_${response.status}`;
  throw error;
}

function isFatalOperationalError(code) {
  return [
    'HTTP_401',
    'RATE_LIMIT',
    'LIMITE_OPERACIONAL',
    'API_HTTP_401',
    'API_HTTP_403',
    'API_HTTP_503',
  ].includes(code);
}

function classify(centro) {
  const address = toAddress(centro);
  if (!force && centro.LOCALIZACAO?.STATUS === 'CONFIRMADA') {
    return { centro, address, resultado: 'IGNORADO', motivo: 'localização já confirmada' };
  }
  if (!hasSufficientAddress(address)) {
    return { centro, address, resultado: 'IGNORADO', motivo: 'endereço insuficiente' };
  }
  return { centro, address, resultado: dryRun ? 'ELEGIVEL' : 'PENDENTE', motivo: dryRun ? 'seria consultado' : '' };
}

async function processItem(item, index, total) {
  const scope = itemScope(item, index, total);
  const baseReport = {
    centroId: item.centro._id,
    nomeCentro: item.centro.NOME_CENTRO,
    statusAnterior: item.centro.LOCALIZACAO?.STATUS || 'PENDENTE',
    resultado: item.resultado,
    motivo: item.motivo,
  };
  if (item.resultado !== 'PENDENTE') {
    log(scope, `${item.resultado}: ${item.motivo || 'nenhuma ação necessária'}.`);
    return baseReport;
  }

  const addressHash = hashAddress(item.address);
  try {
    log(
      scope,
      `Consultando Geoapify: ${formatAddress(item.address)}.`,
    );
    const result = await geocode(item.address);
    const assessment = result ? assessConfirmation(item.address, result) : undefined;
    const location = result
      ? {
          ENDERECO_HASH: addressHash,
          LATITUDE: result.latitude,
          LONGITUDE: result.longitude,
          STATUS: assessment.confirmed ? 'CONFIRMADA' : 'APROXIMADA',
          PRECISAO: result.resultType?.toLocaleUpperCase('pt-BR'),
          CONFIANCA: result.confidence,
          ORIGEM: 'GEOAPIFY',
          PLACE_ID: result.placeId,
          ENDERECO_FORMATADO: result.formattedAddress,
        }
      : { ENDERECO_HASH: addressHash, STATUS: 'NAO_ENCONTRADA', ORIGEM: 'GEOAPIFY' };

    if (result) {
      log(
        scope,
        `Resposta recebida: status=${location.STATUS}, precisão=${location.PRECISAO || 'não informada'}, confiança=${location.CONFIANCA}, confiança_prédio=${result.confidenceBuilding ?? 'ausente'}, match_type=${result.matchType || 'ausente'}, retorno="${oneLine(result.formattedAddress)}"${assessment.rejectionReasons.length ? `, motivos=${assessment.rejectionReasons.join('; ')}` : ''}.`,
      );
    } else {
      log(scope, 'Geoapify não encontrou resultados para o endereço.');
    }

    log(scope, `Salvando localização com status=${location.STATUS}.`);
    const centro = await saveLocation(item.centro._id, location);
    log(
      scope,
      `Concluído com status=${centro.LOCALIZACAO?.STATUS || location.STATUS}.`,
    );
    return {
      ...baseReport,
      resultado: centro.LOCALIZACAO?.STATUS || location.STATUS,
      precisao: centro.LOCALIZACAO?.PRECISAO,
      confianca: centro.LOCALIZACAO?.CONFIANCA,
      motivo: '',
    };
  } catch (error) {
    const code = error.code || 'UNEXPECTED';
    if (isFatalOperationalError(code)) {
      log(scope, `Erro operacional fatal: código=${code}; ${error.message}`);
      throw error;
    }
    if (code !== 'LIMITE_OPERACIONAL') {
      try {
        log(scope, `Registrando STATUS=ERRO, código=${code}.`);
        await saveLocation(item.centro._id, {
          ENDERECO_HASH: addressHash,
          STATUS: 'ERRO',
          ORIGEM: 'GEOAPIFY',
          ERRO_CODIGO: code,
        });
      } catch (saveError) {
        log(scope, `Não foi possível registrar o erro na API: ${saveError.message}`);
        // O erro original é o mais útil no relatório; a próxima execução tentará novamente.
      }
    }
    log(scope, `Falhou: código=${code}; ${error.message}`);
    return { ...baseReport, resultado: code === 'LIMITE_OPERACIONAL' ? 'IGNORADO' : 'ERRO', motivo: error.message };
  }
}

async function mapWithConcurrency(items, workerCount, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index], index, items.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(workerCount, items.length) }, () => worker()));
  return results;
}

function escapeCsv(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

async function saveReports(results) {
  const columns = ['centroId', 'nomeCentro', 'statusAnterior', 'resultado', 'precisao', 'confianca', 'motivo'];
  const csv = [
    columns.map(escapeCsv).join(','),
    ...results.map((row) => columns.map((column) => escapeCsv(row[column])).join(',')),
  ].join('\n');
  await Promise.all([
    writeFile(`${reportPrefix}.json`, `${JSON.stringify(results, null, 2)}\n`),
    writeFile(`${reportPrefix}.csv`, `${csv}\n`),
  ]);
}

if (!dryRun && !geoapifyApiKey) throw new Error('GEOAPIFY_API_KEY é obrigatória quando DRY_RUN=false.');
if (!dryRun && !operationalToken) {
  throw new Error('LOCATION_UPDATE_TOKEN é obrigatório quando DRY_RUN=false.');
}

log(
  'início',
  `Modo=${dryRun ? 'DRY-RUN' : 'EXECUÇÃO'}, concorrência=${concurrency}, intervalo=${intervalMs}ms, limite=${maxCalls} chamadas.`,
);
if (!dryRun) {
  log('preflight', 'Validando rota e token antes de chamar o Geoapify.');
  await validateLocationEndpoint();
}
log('API', `Carregando centros de ${apiBaseUrl}.`);
const centros = await loadCentros();
if (!Array.isArray(centros)) throw new Error('A API não retornou uma lista de centros.');
log('centros', `${centros.length} centro(s) carregado(s).`);

const classified = centros.map(classify);
const results = dryRun
  ? classified.map((item, index) => {
      log(
        itemScope(item, index, classified.length),
        `${item.resultado}: ${item.motivo || 'nenhuma ação necessária'}.`,
      );
      return {
        centroId: item.centro._id,
        nomeCentro: item.centro.NOME_CENTRO,
        statusAnterior: item.centro.LOCALIZACAO?.STATUS || 'PENDENTE',
        resultado: item.resultado,
        motivo: item.motivo,
      };
    })
  : await mapWithConcurrency(classified, concurrency, processItem);

await saveReports(results);
const summary = results.reduce((counts, item) => {
  counts[item.resultado] = (counts[item.resultado] || 0) + 1;
  return counts;
}, {});
console.table(summary);
console.log(`Chamadas Geoapify: ${geoapifyCalls}/${maxCalls}`);
console.log(`Relatórios: ${reportPrefix}.json e ${reportPrefix}.csv`);
log('fim', `${results.length} centro(s) processado(s).`);

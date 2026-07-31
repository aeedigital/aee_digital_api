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
const timeoutMs = positiveInteger(process.env.GEOCODING_TIMEOUT_MS, 5000);
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

function isConfirmed(address, result) {
  const addressHasNumber = /\d/.test(address.ENDERECO);
  return (
    result.matchType === 'full_match' &&
    result.confidence >= 0.95 &&
    (!addressHasNumber || (result.confidenceBuilding ?? 0) >= 0.95) &&
    matchesText(address.CIDADE, [result.city]) &&
    matchesAdministrativeArea(address.ESTADO, [result.state, result.stateCode]) &&
    matchesCountry(address.PAIS, [result.country, result.countryCode]) &&
    matchesPostcode(address.CEP, result.postcode)
  );
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
    throw new Error(`${options.method || 'GET'} ${path} retornou ${response.status}: ${JSON.stringify(payload)}`);
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
      country: item.country,
      countryCode: item.country_code,
      postcode: item.postcode,
    };
  } catch (error) {
    if (error.name === 'AbortError') error.code = 'TIMEOUT';
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

async function processItem(item) {
  const baseReport = {
    centroId: item.centro._id,
    nomeCentro: item.centro.NOME_CENTRO,
    statusAnterior: item.centro.LOCALIZACAO?.STATUS || 'PENDENTE',
    resultado: item.resultado,
    motivo: item.motivo,
  };
  if (item.resultado !== 'PENDENTE') return baseReport;

  const addressHash = hashAddress(item.address);
  try {
    const result = await geocode(item.address);
    const location = result
      ? {
          ENDERECO_HASH: addressHash,
          LATITUDE: result.latitude,
          LONGITUDE: result.longitude,
          STATUS: isConfirmed(item.address, result) ? 'CONFIRMADA' : 'APROXIMADA',
          PRECISAO: result.resultType?.toLocaleUpperCase('pt-BR'),
          CONFIANCA: result.confidence,
          ORIGEM: 'GEOAPIFY',
          PLACE_ID: result.placeId,
          ENDERECO_FORMATADO: result.formattedAddress,
        }
      : { ENDERECO_HASH: addressHash, STATUS: 'NAO_ENCONTRADA', ORIGEM: 'GEOAPIFY' };

    const centro = await saveLocation(item.centro._id, location);
    return {
      ...baseReport,
      resultado: centro.LOCALIZACAO?.STATUS || location.STATUS,
      precisao: centro.LOCALIZACAO?.PRECISAO,
      confianca: centro.LOCALIZACAO?.CONFIANCA,
      motivo: '',
    };
  } catch (error) {
    const code = error.code || 'UNEXPECTED';
    if (code !== 'LIMITE_OPERACIONAL') {
      try {
        await saveLocation(item.centro._id, {
          ENDERECO_HASH: addressHash,
          STATUS: 'ERRO',
          ORIGEM: 'GEOAPIFY',
          ERRO_CODIGO: code,
        });
      } catch {
        // O erro original é o mais útil no relatório; a próxima execução tentará novamente.
      }
    }
    return { ...baseReport, resultado: code === 'LIMITE_OPERACIONAL' ? 'IGNORADO' : 'ERRO', motivo: error.message };
  }
}

async function mapWithConcurrency(items, workerCount, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index]);
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

const centros = await loadCentros();
if (!Array.isArray(centros)) throw new Error('A API não retornou uma lista de centros.');

const classified = centros.map(classify);
const results = dryRun
  ? classified.map((item) => ({
      centroId: item.centro._id,
      nomeCentro: item.centro.NOME_CENTRO,
      statusAnterior: item.centro.LOCALIZACAO?.STATUS || 'PENDENTE',
      resultado: item.resultado,
      motivo: item.motivo,
    }))
  : await mapWithConcurrency(classified, concurrency, processItem);

await saveReports(results);
const summary = results.reduce((counts, item) => {
  counts[item.resultado] = (counts[item.resultado] || 0) + 1;
  return counts;
}, {});
console.table(summary);
console.log(`Chamadas Geoapify: ${geoapifyCalls}/${maxCalls}`);
console.log(`Relatórios: ${reportPrefix}.json e ${reportPrefix}.csv`);

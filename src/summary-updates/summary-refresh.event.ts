export interface SummaryRefreshEvent {
  schemaVersion: 'center.summary-refresh.v1';
  eventId: string;
  summaryId: string;
  centroId: string;
  sourceVersion: {
    updatedAt: string;
    createdAt: string;
    summaryId: string;
  };
}

const DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasExactKeys = (
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
): boolean =>
  Object.keys(value).length === expectedKeys.length &&
  expectedKeys.every((key) => Object.prototype.hasOwnProperty.call(value, key));

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isDateTime = (value: unknown): value is string =>
  typeof value === 'string' &&
  DATE_TIME_PATTERN.test(value) &&
  Number.isFinite(Date.parse(value));

export function parseSummaryRefreshEvent(value: unknown): SummaryRefreshEvent {
  const eventKeys = [
    'schemaVersion',
    'eventId',
    'summaryId',
    'centroId',
    'sourceVersion',
  ] as const;
  const versionKeys = ['updatedAt', 'createdAt', 'summaryId'] as const;

  if (
    !isRecord(value) ||
    !hasExactKeys(value, eventKeys) ||
    value.schemaVersion !== 'center.summary-refresh.v1' ||
    !isNonEmptyString(value.eventId) ||
    !isNonEmptyString(value.summaryId) ||
    !isNonEmptyString(value.centroId) ||
    !isRecord(value.sourceVersion) ||
    !hasExactKeys(value.sourceVersion, versionKeys) ||
    !isDateTime(value.sourceVersion.updatedAt) ||
    !isDateTime(value.sourceVersion.createdAt) ||
    !isNonEmptyString(value.sourceVersion.summaryId)
  ) {
    throw new TypeError('Invalid center summary refresh event');
  }

  return {
    schemaVersion: value.schemaVersion,
    eventId: value.eventId,
    summaryId: value.summaryId,
    centroId: value.centroId,
    sourceVersion: {
      updatedAt: value.sourceVersion.updatedAt,
      createdAt: value.sourceVersion.createdAt,
      summaryId: value.sourceVersion.summaryId,
    },
  };
}

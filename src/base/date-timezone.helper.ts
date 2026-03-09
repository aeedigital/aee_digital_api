const BRAZIL_TIME_ZONE = 'America/Sao_Paulo';
const BRAZIL_OFFSET = '-03:00';

type DateLike = Date | string | null | undefined;

function toDate(value: DateLike): Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toBrazilTimestamp(value: DateLike): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const date = toDate(value);
  if (!date) return null;

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BRAZIL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    hourCycle: 'h23',
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  const ms = String(date.getUTCMilliseconds()).padStart(3, '0');

  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}.${ms}${BRAZIL_OFFSET}`;
}

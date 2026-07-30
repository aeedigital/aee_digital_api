export function parseDateInput(value?: string): Date | undefined {
  if (!value) return undefined;

  // Try ISO first
  const iso = new Date(value);
  if (!isNaN(iso.getTime())) return iso;

  // Try dd/MM/yyyy
  const match = value.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (!isNaN(date.getTime())) return date;
  }

  return undefined;
}

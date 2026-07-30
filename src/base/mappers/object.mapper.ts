export type KeyMap = Record<string, string>;

export const mapProps = <TSource extends Record<string, any>, TTarget extends Record<string, any>>(
  source: TSource | undefined,
  mapping: KeyMap,
): TTarget => {
  const result: Record<string, any> = {};
  if (!source) return result as TTarget;
  for (const [from, to] of Object.entries(mapping)) {
    const value = (source as any)[from];
    if (value !== undefined) result[to] = value;
  }
  return result as TTarget;
};

export const omitUndefined = <T extends Record<string, any>>(payload: T): T => {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) result[key] = value;
  }
  return result as T;
};

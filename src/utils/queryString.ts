// Query strings may arrive as arrays (?color=a&color=b); only plain values are considered.
export function queryString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

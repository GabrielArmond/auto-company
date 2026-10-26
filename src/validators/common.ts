export function asRecord(body: unknown): Record<string, unknown> {
  return (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>;
}

export function requiredString(value: unknown, field: string, errors: string[]): string {
  if (typeof value !== 'string' || !value.trim()) {
    errors.push(`The "${field}" field is required`);
    return '';
  }
  return value.trim();
}

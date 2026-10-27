import { isValidId } from '../utils/isValidId';

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

export function requiredId(value: unknown, field: string, errors: string[]): string {
  const id = requiredString(value, field, errors);
  if (id && !isValidId(id)) {
    errors.push(`The "${field}" field must contain only letters, numbers, "-" or "_" (up to 128 characters)`);
  }
  return id;
}

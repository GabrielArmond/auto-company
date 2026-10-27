import { isValidId } from '../utils/isValidId';

// Parses a request body into a plain object so fields can be read safely; anything else (missing body,
// null, a string) becomes {}, which then fails the required field checks.
export function asRecord(body: unknown): Record<string, unknown> {
  return (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>;
}

// Reads a required text field and returns it trimmed ('  Fiat ' -> 'Fiat'). Non-strings and blank strings
// add an error to errors and return ''.
export function requiredString(value: unknown, field: string, errors: string[]): string {
  if (typeof value !== 'string' || !value.trim()) {
    errors.push(`The "${field}" field is required`);
    return '';
  }
  return value.trim();
}

// Like requiredString, but the value must also be a valid id (letters, numbers, '-' and '_'), so it can be
// used safely as a document id: ' abc123 ' -> 'abc123'; 'drivers/1' -> error.
export function requiredId(value: unknown, field: string, errors: string[]): string {
  const id = requiredString(value, field, errors);
  if (id && !isValidId(id)) {
    errors.push(`The "${field}" field must contain only letters, numbers, "-" or "_" (up to 128 characters)`);
  }
  return id;
}

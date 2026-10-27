export const ID_PATTERN = '^[A-Za-z0-9_-]{1,128}$';

const idRegex = new RegExp(ID_PATTERN);

export function isValidId(id: unknown): id is string {
  return typeof id === 'string' && idRegex.test(id);
}

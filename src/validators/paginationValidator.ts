import type { PageRequest } from '../models/pagination';
import { HttpError } from '../utils/HttpError';
import { isValidId } from '../utils/isValidId';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface PaginationQuery {
  limit?: string;
  cursor?: string;
}

// Parses the ?limit= and ?cursor= query parameters, which arrive as strings.
// Missing or empty values fall back to the defaults: {} -> { limit: 20 };
// { limit: '50', cursor: 'q8Zt1nV3kXyP' } -> { limit: 50, cursor: 'q8Zt1nV3kXyP' }.
// A limit that is not an integer between 1 and MAX_PAGE_SIZE ('0', '1.5', '500', 'abc') or a cursor
// that is not a valid id is rejected with 400.
export function parsePagination({ limit, cursor }: PaginationQuery = {}): PageRequest {
  const errors: string[] = [];

  let size = DEFAULT_PAGE_SIZE;
  if (limit) {
    size = Number(limit);
    if (!/^\d+$/.test(limit) || size < 1 || size > MAX_PAGE_SIZE) {
      errors.push(`The "limit" parameter must be an integer between 1 and ${MAX_PAGE_SIZE}`);
    }
  }

  if (cursor && !isValidId(cursor)) {
    errors.push('The "cursor" parameter must be the nextCursor returned by the previous page');
  }

  if (errors.length) throw HttpError.badRequest('Invalid query parameters', errors);

  return cursor ? { limit: size, cursor } : { limit: size };
}

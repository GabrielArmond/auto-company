import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, parsePagination } from '../../src/validators/paginationValidator';

describe('parsePagination', () => {
  it('uses the default page size when nothing is informed', () => {
    expect(parsePagination()).toEqual({ limit: DEFAULT_PAGE_SIZE });
    expect(parsePagination({ limit: '', cursor: '' })).toEqual({ limit: DEFAULT_PAGE_SIZE });
  });

  it('parses limit and cursor', () => {
    expect(parsePagination({ limit: '50', cursor: 'q8Zt1nV3kXyP' })).toEqual({ limit: 50, cursor: 'q8Zt1nV3kXyP' });
  });

  it.each(['1', String(MAX_PAGE_SIZE)])('accepts the limit %p', (limit) => {
    expect(parsePagination({ limit }).limit).toBe(Number(limit));
  });

  it.each(['0', '-1', '1.5', '1e2', 'abc', String(MAX_PAGE_SIZE + 1)])('rejects the limit %p with 400', (limit) => {
    expect(() => parsePagination({ limit })).toThrow(
      expect.objectContaining({
        status: 400,
        details: [`The "limit" parameter must be an integer between 1 and ${MAX_PAGE_SIZE}`],
      }),
    );
  });

  it.each(['a/b', '..', 'a'.repeat(129)])('rejects the cursor %p with 400', (cursor) => {
    expect(() => parsePagination({ cursor })).toThrow(expect.objectContaining({ status: 400 }));
  });
});

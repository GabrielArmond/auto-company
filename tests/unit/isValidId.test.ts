import { isValidId } from '../../src/utils/isValidId';

describe('isValidId', () => {
  it.each(['1', 'q8Zt1nV3kXyP', 'abc_DEF-123', 'a'.repeat(128)])('accepts %p', (id) => {
    expect(isValidId(id)).toBe(true);
  });

  it.each(['', 'a/b', '..', '.', 'a b', 'á', '__name__.x', 'a'.repeat(129), 123, null, undefined])(
    'rejects %p',
    (id) => {
      expect(isValidId(id)).toBe(false);
    },
  );
});

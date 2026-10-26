import { normalizeSearchTerm } from '../../src/utils/normalizeSearchTerm';

describe('normalizeSearchTerm', () => {
  it.each([
    ['Black', 'black'],
    ['FIAT', 'fiat'],
    ['  Silver  ', 'silver'],
    ['Volkswagen Up', 'volkswagen up'],
  ])('normalizes %p to %p', (input, expected) => {
    expect(normalizeSearchTerm(input)).toBe(expected);
  });
});

import { buildPrefixIndex, matchesNameQuery, toSearchWords } from '../../src/utils/nameSearch';

describe('nameSearch', () => {
  describe('toSearchWords', () => {
    it('lowercases, removes accents and splits on whitespace', () => {
      expect(toSearchWords('  João   DA Conceição ')).toEqual(['joao', 'da', 'conceicao']);
    });

    it('returns an empty list for blank text', () => {
      expect(toSearchWords('   ')).toEqual([]);
    });
  });

  describe('buildPrefixIndex', () => {
    it('contains every prefix of every word, without duplicates', () => {
      expect(buildPrefixIndex('Ana Ana')).toEqual(['a', 'an', 'ana']);
      expect(buildPrefixIndex('Zé Lu')).toEqual(['z', 'ze', 'l', 'lu']);
    });
  });

  describe('matchesNameQuery', () => {
    const name = 'João da Silva';

    it.each(['joao', 'JOÃO', 'silva', 'Sil', 'jo sil', 'silva joao', 'da'])('matches %p', (searchQuery) => {
      expect(matchesNameQuery(name, searchQuery)).toBe(true);
    });

    it.each(['ilva', 'maria', 'joao maria', 'joaos'])('does not match %p', (searchQuery) => {
      expect(matchesNameQuery(name, searchQuery)).toBe(false);
    });
  });
});
